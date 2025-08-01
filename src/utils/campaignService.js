import { supabase } from './supabase';
import creditService from './creditService';
import lixService from './lixService';
import openaiService from './openaiService';

const campaignService = {
  // Get all campaigns for the current user
  getCampaigns: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          linkedin_leads(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform data to include lead counts
      const campaignsWithStats = data?.map((campaign) => ({
        ...campaign,
        leads_generated: campaign.linkedin_leads?.[0]?.count || 0,
      })) || [];

      return { success: true, data: campaignsWithStats };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        return {
          success: false,
          error:
            'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.',
        };
      }
      return { success: false, error: 'Failed to load campaigns' };
    }
  },

  // Create a new campaign with credit validation and lead fetching
  createCampaign: async (campaignData) => {
    try {
      const userId = campaignData.user_id;

      // Check if user has enough credits
      const creditCheck = await creditService.checkCreditSufficiency(userId, 20);
      if (!creditCheck.success) {
        return creditCheck;
      }

      if (!creditCheck.data.hasEnoughCredits) {
        return {
          success: false,
          error: `Insufficient credits. You need ${creditCheck.data.shortfall} more credits to create this campaign.`,
          insufficientCredits: true,
        };
      }

      // Deduct credits first
      const deductResult = await creditService.deductCredits(userId, 20, `Campaign: ${campaignData.name}`);
      if (!deductResult.success) {
        return deductResult;
      }

      // Create campaign in Lix if filters are provided
      let lixCampaignId = null;
      if (
        campaignData.target_job_titles?.length > 0 ||
        campaignData.target_industries?.length > 0 ||
        campaignData.target_locations?.length > 0
      ) {
        const lixResult = await lixService.createLixCampaign({
          name: campaignData.name,
          message: campaignData.message,
          target_job_titles: campaignData.target_job_titles || [],
          target_industries: campaignData.target_industries || [],
          target_locations: campaignData.target_locations || [],
          message_template: campaignData.message_template || campaignData.message,
        });

        if (lixResult.success) {
          lixCampaignId = lixResult.data.lixCampaignId;
        } else {
          // Refund credits if Lix campaign creation fails
          await creditService.addCredits(userId, 20, null, 0);
          return { success: false, error: `Failed to create Lix campaign: ${lixResult.error}` };
        }
      }

      // Create campaign in database
      const { data, error } = await supabase
        .from('campaigns')
        .insert([
          {
            ...campaignData,
            lix_campaign_id: lixCampaignId,
            credits_used: 20,
            status: 'active', // Auto-start campaign
          },
        ])
        .select()
        .single();

      if (error) {
        // Refund credits if campaign creation failed
        await creditService.addCredits(userId, 20, null, 0);
        return { success: false, error: error.message };
      }

      // Immediately start lead generation process
      const leadGenerationResult = await campaignService.generateLeadsForCampaign(data.id, {
        jobTitles: campaignData.target_job_titles,
        industries: campaignData.target_industries,
        locations: campaignData.target_locations,
        limit: 50,
      });

      // Update campaign data with lead generation results
      const updatedCampaign = {
        ...data,
        leads_generated: leadGenerationResult.success ? leadGenerationResult.data.leadsGenerated : 0,
        lead_generation_status: leadGenerationResult.success ? 'completed' : 'failed',
        lead_generation_error: leadGenerationResult.success ? null : leadGenerationResult.error,
      };

      // Update campaign stats in database
      if (leadGenerationResult.success && leadGenerationResult.data.leadsGenerated > 0) {
        await supabase
          .from('campaigns')
          .update({
            leads_generated: leadGenerationResult.data.leadsGenerated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      }

      return { 
        success: true, 
        data: updatedCampaign,
        leadGeneration: leadGenerationResult
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        return {
          success: false,
          error:
            'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.',
        };
      }
      return { success: false, error: 'Failed to create campaign' };
    }
  },

  // Generate leads for campaign using Lix API
  generateLeadsForCampaign: async (campaignId, filters) => {
    try {
      console.log('Starting lead generation for campaign:', campaignId, 'with filters:', filters);

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, user_profiles(id)')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        console.error('Campaign not found:', campaignError);
        return { success: false, error: 'Campaign not found' };
      }

      // Update campaign status to indicate lead generation is in progress
      await supabase
        .from('campaigns')
        .update({ 
          status: 'generating_leads',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Fetch leads from Lix API with enhanced error handling
      console.log('Fetching leads from Lix API...');
      const lixResult = await lixService.searchLeads(filters);

      if (!lixResult.success) {
        console.error('Failed to fetch leads from Lix:', lixResult.error);

        // Update campaign status to failed
        await supabase
          .from('campaigns')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        return { 
          success: false, 
          error: `Lix API Error: ${lixResult.error}`,
          retryable: true
        };
      }

      console.log(`Fetched ${lixResult.data.leads.length} leads from Lix API`);

      // Transform and prepare leads for database insertion
      const leadsToInsert = lixResult.data.leads.map((lead) => ({
        ...lead,
        campaign_id: campaignId,
        user_id: campaign.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (leadsToInsert.length > 0) {
        console.log(`Inserting ${leadsToInsert.length} leads into database...`);

        const { error: insertError } = await supabase
          .from('linkedin_leads')
          .insert(leadsToInsert);

        if (insertError) {
          console.error('Failed to save leads:', insertError);

          // Update campaign status to failed
          await supabase
            .from('campaigns')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaignId);

          return { success: false, error: 'Failed to save leads to database' };
        }

        // Update campaign with successful lead generation
        await supabase
          .from('campaigns')
          .update({
            status: 'active',
            leads_generated: leadsToInsert.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        console.log(`Successfully generated ${leadsToInsert.length} leads for campaign ${campaignId}`);
      } else {
        // No leads found but API call was successful
        await supabase
          .from('campaigns')
          .update({
            status: 'active',
            leads_generated: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
      }

      return {
        success: true,
        data: {
          leadsGenerated: leadsToInsert.length,
          totalAvailable: lixResult.data.total,
          hasMore: lixResult.data.hasMore,
          campaignId: campaignId,
        },
      };
    } catch (error) {
      console.error('Error generating leads for campaign:', error);

      // Update campaign status to failed
      try {
        await supabase
          .from('campaigns')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
      } catch (updateError) {
        console.error('Failed to update campaign status:', updateError);
      }

      return { 
        success: false, 
        error: 'Failed to generate leads: ' + error.message,
        retryable: true
      };
    }
  },

  // Send AI-powered messages to leads
  sendCampaignMessages: async (campaignId) => {
    try {
      // Get campaign and unsent leads
      const { data: leads, error } = await supabase
        .from('linkedin_leads')
        .select('*, campaigns(message_template, name)')
        .eq('campaign_id', campaignId)
        .eq('message_sent', false)
        .limit(20); // LinkedIn daily limit consideration

      if (error) {
        return { success: false, error: error.message };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const lead of leads || []) {
        try {
          // Generate personalized message using AI
          const messageResult = await openaiService.generatePersonalizedMessage(
            lead,
            lead.campaigns.message_template,
            `Campaign: ${lead.campaigns.name}`
          );

          if (!messageResult.success) {
            failedCount++;
            continue;
          }

          // Send message via Lix API (already uses proxy)
          const sendResult = await lixService.sendLinkedInMessage(
            lead.lix_lead_id,
            messageResult.message,
            campaignId
          );

          if (sendResult.success) {
            // Update lead status
            await supabase
              .from('linkedin_leads')
              .update({
                message_sent: true,
                message_sent_at: new Date().toISOString(),
              })
              .eq('id', lead.id);

            sentCount++;
          } else {
            failedCount++;
          }

          // Add delay to respect LinkedIn rate limits
          await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
        } catch (leadError) {
          console.error(`Failed to send message to lead ${lead.id}:`, leadError);
          failedCount++;
        }
      }

      return {
        success: true,
        data: {
          messagesSent: sentCount,
          messagesFailed: failedCount,
          totalProcessed: sentCount + failedCount,
        },
      };
    } catch (error) {
      console.error('Error sending campaign messages:', error);
      return { success: false, error: 'Failed to send campaign messages' };
    }
  },

  // Monitor replies and analyze intent
  monitorReplies: async (campaignId) => {
    try {
      // Get campaign leads with sent messages
      const { data: leads, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('message_sent', true)
        .eq('replied', false);

      if (error) {
        return { success: false, error: error.message };
      }

      // Get inbox messages from Lix via lixService (already uses proxy)
      const messagesResult = await lixService.getInboxMessages(campaignId);

      if (!messagesResult.success) {
        return messagesResult;
      }

      const replies = messagesResult.data.messages.filter((msg) => msg.is_reply);

      for (const reply of replies) {
        const lead = leads?.find((l) => l.lix_lead_id === reply.sender_id);

        if (lead) {
          // Analyze reply intent using AI
          const analysisResult = await openaiService.analyzeReplyIntent(
            lead.campaigns?.message_template || 'Original message',
            reply.content
          );

          if (analysisResult.success) {
            // Update lead with reply and analysis
            await supabase
              .from('linkedin_leads')
              .update({
                replied: true,
                replied_at: reply.timestamp,
                reply_content: reply.content,
                reply_intent: analysisResult.analysis.intent,
                ai_analysis: analysisResult.analysis,
              })
              .eq('id', lead.id);

            // If interested, trigger meeting scheduling flow
            if (analysisResult.analysis.intent === 'interested') {
              console.log(`Lead ${lead.full_name} showed interest - triggering scheduling flow`);
            }

            // Record reply monitoring
            await supabase
              .from('reply_monitoring')
              .insert({
                user_id: lead.user_id,
                lead_id: lead.id,
                original_message: lead.campaigns?.message_template,
                reply_content: reply.content,
                ai_analysis: analysisResult.analysis,
                intent_score: analysisResult.analysis.confidence,
                action_taken: analysisResult.analysis.suggested_action,
              });
          }
        }
      }

      // Update campaign stats
      await supabase.rpc('update_campaign_stats', { campaign_uuid: campaignId });

      return { success: true };
    } catch (error) {
      console.error('Error monitoring replies:', error);
      return { success: false, error: 'Failed to monitor replies' };
    }
  },

  // Update a campaign
  updateCampaign: async (campaignId, updates) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        return {
          success: false,
          error:
            'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.',
        };
      }
      return { success: false, error: 'Failed to update campaign' };
    }
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .select();

      if (error) {
        console.error('Error deleting campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in deleteCampaign:', error);
      return { success: false, error: 'Failed to delete campaign' };
    }
  },

  /**
   * Get a single campaign by ID
   */
  getCampaignById: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching campaign:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getCampaignById:', error);
      return { success: false, error: 'Failed to fetch campaign' };
    }
  },

  /**
   * Get leads for a specific campaign
   */
  getCampaignLeads: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select(`
          *,
          campaigns(name, id),
          meetings(id, scheduled_at, meeting_status)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaign leads:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getCampaignLeads:', error);
      return { success: false, error: 'Failed to fetch campaign leads' };
    }
  },
};

export default campaignService;