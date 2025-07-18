import { supabase } from './supabase';

const campaignService = {
  // Get all campaigns for the current user
  getCampaigns: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

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
      return { success: false, error: 'Failed to load campaigns' };
    }
  },

  // Create a new campaign
  createCampaign: async (campaignData) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
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
      return { success: false, error: 'Failed to create campaign' };
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

  // Get campaign stats
  getCampaignStats: async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('leads_generated, meetings_booked, reply_rate');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        totalLeads: data.reduce((sum, campaign) => sum + (campaign.leads_generated || 0), 0),
        totalMeetings: data.reduce((sum, campaign) => sum + (campaign.meetings_booked || 0), 0),
        avgReplyRate: data.length > 0 ? data.reduce((sum, campaign) => sum + (campaign.reply_rate || 0), 0) / data.length : 0
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
  }
};

export default campaignService;