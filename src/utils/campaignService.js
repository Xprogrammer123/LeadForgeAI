import { supabase } from './supabase';
import lixService from './lixService';

const campaignService = {
  // 🔹 Get all campaigns for the current user
  getCampaigns: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`*, linkedin_leads(count), id`)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };

      const campaignsWithStats = data?.map((campaign) => ({
        ...campaign,
        leads_generated: campaign.linkedin_leads?.[0]?.count || 0,
        campaign_id: campaign.id, // Ensuring campaign_id is always present explicitly
      })) || [];

      return { success: true, data: campaignsWithStats };
    } catch (error) {
      const message = error?.message?.includes('Failed to fetch')
        ? 'Cannot connect to Supabase. Check project status.'
        : 'Failed to load campaigns';
      return { success: false, error: message };
    }
  },

  // 🔹 Create campaign
  createCampaign: async (campaignData) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...campaignData, status: campaignData.status || 'draft' }])
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) {
      const message = error?.message?.includes('Failed to fetch')
        ? 'Cannot connect to Supabase. Check project status.'
        : 'Failed to create campaign';
      return { success: false, error: message };
    }
  },

  // 🔹 Generate leads from Lix
  generateLeadsForCampaign: async (campaignId, filters) => {
    try {
      console.log('⏳ Starting enrichment:', { campaignId, filters });

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, user_id')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign)
        return { success: false, error: 'Campaign not found' };

      // Update to "enriching"
      await supabase
        .from('campaigns')
        .update({
          status: 'enriching',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      const lixResult = await lixService.searchLeads(filters);
      if (!lixResult.success) {
        await supabase
          .from('campaigns')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        return {
          success: false,
          error: `Lix API Error: ${lixResult.error}`,
          retryable: true,
        };
      }

      const leads = lixResult.data.leads || [];
      const leadsToInsert = leads.map((lead) => ({
        ...lead,
        campaign_id: campaign.id,
        user_id: campaign.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (leadsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('linkedin_leads')
          .insert(leadsToInsert);

        if (insertError) {
          await supabase
            .from('campaigns')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', campaignId);

          return { success: false, error: 'Failed to insert leads' };
        }
      }

      await supabase
        .from('campaigns')
        .update({
          status: 'active',
          leads_generated: leadsToInsert.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return {
        success: true,
        data: {
          leadsGenerated: leadsToInsert.length,
          totalAvailable: lixResult.data.total,
          hasMore: lixResult.data.hasMore,
          campaignId,
        },
      };
    } catch (error) {
      console.error('Lead generation error:', error.message);

      await supabase
        .from('campaigns')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      return {
        success: false,
        error: 'Failed to generate leads: ' + error.message,
        retryable: true,
      };
    }
  },

  // 🔹 Delete campaign
  deleteCampaign: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .select();

      if (error) return { success: false, error: error.message };
      return { success: true, data: data[0] };
    } catch (error) {
      return { success: false, error: 'Failed to delete campaign' };
    }
  },

  // 🔹 Get one campaign by ID
  getCampaignById: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch campaign' };
    }
  },

  // 🔹 Get leads for one campaign
  getCampaignLeads: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select(`
          *,
          campaign_id,
          campaigns(name, id),
          meetings(id, scheduled_at, meeting_status)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };

      const leadsWithCampaignId = (data || []).map(lead => ({
        ...lead,
        campaign_id: lead.campaign_id // Ensures campaign_id is always available explicitly
      }));

      return { success: true, data: leadsWithCampaignId };
    } catch (error) {
      return { success: false, error: 'Failed to fetch campaign leads' };
    }
  },

  // 🔹 Update campaign status
  updateCampaignStatus: async (campaignId, status) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update campaign status' };
    }
  },
};

export default campaignService;
