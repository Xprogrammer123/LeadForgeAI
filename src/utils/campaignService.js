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
      const campaignsWithStats = data?.map(campaign => ({
        ...campaign,
        leads_generated: campaign.linkedin_leads?.[0]?.count || 0
      })) || [];

      return { success: true, data: campaignsWithStats };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
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
          insufficientCredits: true
        };
      }

      // Deduct credits first
      const deductResult = await creditService.deductCredits(userId, 20, `Campaign: ${campaignData.name}`);
      if (!deductResult.success) {
        return deductResult;
      }

      // Create campaign in Lix if filters are provided
      let lixCampaignId = null;
      if (campaignData.target_job_titles || campaignData.target_industries || campaignData.target_locations) {
        const lixResult = await lixService.createLixCampaign({
          name: campaignData.name,
          message: campaignData.message,
          target_job_titles: campaignData.target_job_titles || [],
          target_industries: campaignData.target_industries || [],
          target_locations: campaignData.target_locations || [],
          message_template: campaignData.message_template || campaignData.message
        });
        
        if (lixResult.success) {
          lixCampaignId = lixResult.data.lixCampaignId;
        }
      }

      // Create campaign in database
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...campaignData,
          lix_campaign_id: lixCampaignId,
          credits_used: 20,
          status: 'active' // Auto-start campaign
        }])
        .select()
        .single();

      if (error) {
        // Refund credits if campaign creation failed
        await creditService.addCredits(userId, 20, null, 0);
        return { success: false, error: error.message };
      }

      // Start lead generation process in background
      this.generateLeadsForCampaign(data.id, {
        jobTitles: campaignData.target_job_titles,
        industries: campaignData.target_industries,
        locations: campaignData.target_locations,
        limit: 50
      });

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to create campaign' };
    }
  },

  // Generate leads for campaign using Lix API
  generateLeadsForCampaign: async (campaignId, filters) => {
    try {
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

      // Fetch leads from Lix API
      const lixResult = await lixService.searchLeads(filters);
      
      if (!lixResult.success) {
        console.error('Failed to fetch leads from Lix:', lixResult.error);
        return lixResult;
      }

      // Save leads to database
      const leadsToInsert = lixResult.data.leads.map(lead => ({
        ...lead,
        campaign_id: campaignId,
        user_id: campaign.user_id
      }));

      if (leadsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('linkedin_leads')
          .insert(leadsToInsert);

        if (insertError) {
          console.error('Failed to save leads:', insertError);
          return { success: false, error: 'Failed to save leads' };
        }

        // Update campaign stats
        await supabase.rpc('update_campaign_stats', { campaign_uuid: campaignId });
      }

      return { 
        success: true, 
        data: { 
          leadsGenerated: leadsToInsert.length,
          totalAvailable: lixResult.data.total 
        } 
      };
    } catch (error) {
      console.error('Error generating leads for campaign:', error);
      return { success: false, error: 'Failed to generate leads' };
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

          // Send message via Lix API
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
                message_sent_at: new Date().toISOString()
              })
              .eq('id', lead.id);
            
            sentCount++;
          } else {
            failedCount++;
          }

          // Add delay to respect LinkedIn rate limits
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
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
          totalProcessed: sentCount + failedCount
        }
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

      // Get inbox messages from Lix
      const messagesResult = await lixService.getInboxMessages(campaignId);
      
      if (!messagesResult.success) {
        return messagesResult;
      }

      const replies = messagesResult.data.messages.filter(msg => msg.is_reply);
      
      for (const reply of replies) {
        const lead = leads?.find(l => l.lix_lead_id === reply.sender_id);
        
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
                ai_analysis: analysisResult.analysis
              })
              .eq('id', lead.id);

            // If interested, trigger meeting scheduling flow
            if (analysisResult.analysis.intent === 'interested') {
              // This could trigger an email with scheduling link
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
                action_taken: analysisResult.analysis.suggested_action
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
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to update campaign' };
    }
  },

  // Delete a campaign
  deleteCampaign: async (campaignId) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to delete campaign' };
    }
  },

  // Get campaign stats with real data
  getCampaignStats: async () => {
    try {
      // Get campaign stats
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('leads_generated, meetings_booked, reply_rate');

      if (campaignError) {
        return { success: false, error: campaignError.message };
      }

      // Get total leads from linkedin_leads table
      const { count: totalLeads, error: leadsError } = await supabase
        .from('linkedin_leads')
        .select('*', { count: 'exact', head: true });

      if (leadsError) {
        console.error('Error getting leads count:', leadsError);
      }

      // Get total meetings from meetings table
      const { count: totalMeetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true });

      if (meetingsError) {
        console.error('Error getting meetings count:', meetingsError);
      }

      // Calculate stats
      const stats = {
        totalLeads: totalLeads || campaigns?.reduce((sum, campaign) => sum + (campaign.leads_generated || 0), 0) || 0,
        totalMeetings: totalMeetings || campaigns?.reduce((sum, campaign) => sum + (campaign.meetings_booked || 0), 0) || 0,
        avgReplyRate: campaigns?.length > 0 ? campaigns.reduce((sum, campaign) => sum + (campaign.reply_rate || 0), 0) / campaigns.length : 0
      };

      return { success: true, data: stats };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.' 
        };
      }
      return { success: false, error: 'Failed to load campaign stats' };
    }
  },

  // Get leads for a specific campaign
  getCampaignLeads: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting campaign leads:', error);
      return { success: false, error: 'Failed to get campaign leads' };
    }
  }
};

export default campaignService;