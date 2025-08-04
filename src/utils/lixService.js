import { supabase } from './supabase';

const callLixProxy = async (endpoint, method = 'GET', body = null, queryParams = null) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) throw new Error('No active session. Please log in.');

    const response = await fetch('https://kgrbevxmtuhuenfqixsu.supabase.co/functions/v1/lix-api-proxy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint, method, body, queryParams })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge function error: ${errorText}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.error || `HTTP ${data.status}: Request failed`);
    return data.data;
  } catch (error) {
    console.error('Lix Service Error:', error);
    throw new Error(
      error.message.includes('fetch') || error.message.includes('NetworkError')
        ? 'Cannot connect to Lix API. Check your internet connection.'
        : error.message
    );
  }
};

const lixService = {
  // 🔍 Search for leads
  searchLeads: async (filters) => {
    try {
      const queryParams = {
        job_titles: filters.jobTitles?.join(',') || '',
        industries: filters.industries?.join(',') || '',
        locations: filters.locations?.join(',') || '',
        company_sizes: filters.companySizes?.join(',') || '',
        experience_levels: filters.experienceLevels?.join(',') || '',
        limit: filters.limit || 50,
        include_email: 'true',
        include_phone: 'true',
        verified_only: 'false',
      };

      const data = await callLixProxy('/v1/li/linkedin/search/people', 'GET', null, queryParams);
      const leads = data.leads?.map((lead, index) => ({
        full_name: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || `Lead ${index + 1}`,
        job_title: lead.jobTitle || 'Unknown Position',
        company: lead.companyName || 'Unknown Company',
        location: lead.location || 'Unknown Location',
        linkedin_url: lead.linkedinUrl || '',
        email: lead.email || null,
        phone: lead.phone || null,
        profile_image_url: lead.profileImageUrl || null,
        lix_lead_id: lead.id || `temp_${Date.now()}_${index}`,
        lead_data: {
          industry: lead.industry || null,
          companySize: lead.companySize || null,
          experience: lead.experience || null,
          connections: lead.connections || null,
          verified: lead.verified || false,
          seniority: lead.seniority || null,
          department: lead.department || null,
          skills: lead.skills || [],
          lastActivity: lead.lastActivity || null,
        },
      })) || [];

      return {
        success: true,
        data: {
          leads,
          total: data.total || leads.length,
          hasMore: data.hasMore || false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Lead search failed',
      };
    }
  },

  // 📩 Send LinkedIn message
  sendLinkedInMessage: async (leadId, message, campaignId) => {
    try {
      const data = await callLixProxy('/v1/messages/send', 'POST', {
        recipient_id: leadId,
        message,
        campaign_id: campaignId,
        message_type: 'direct_message',
      });

      return {
        success: true,
        data: {
          messageId: data.message_id,
          status: data.status,
          sentAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Message sending failed',
      };
    }
  },

  // 📥 Get inbox messages
  getInboxMessages: async (campaignId) => {
    try {
      const data = await callLixProxy('/v1/messages/inbox', 'GET', null, { campaign_id: campaignId });
      const messages = data.messages?.map((msg) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        content: msg.content,
        timestamp: msg.timestamp,
        message_type: msg.message_type,
        is_reply: msg.is_reply,
        thread_id: msg.thread_id,
      })) || [];

      return { success: true, data: { messages } };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch inbox messages',
      };
    }
  },

  // 🧠 Create campaign
  createLixCampaign: async (campaignData) => {
    try {
      const data = await callLixProxy('/v1/campaigns', 'POST', {
        name: campaignData.name,
        description: campaignData.message,
        message_template: campaignData.message_template,
        daily_limit: campaignData.daily_limit || 50,
        targeting: {
          job_titles: campaignData.target_job_titles,
          industries: campaignData.target_industries,
          locations: campaignData.target_locations,
        }
      });

      return {
        success: true,
        data: {
          lixCampaignId: data.campaign_id,
          status: data.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create campaign',
      };
    }
  },

  // 📊 Campaign metrics
  getCampaignMetrics: async (lixCampaignId) => {
    try {
      const data = await callLixProxy(`/v1/campaigns/${lixCampaignId}/metrics`, 'GET');

      return {
        success: true,
        data: {
          messagesSent: data.messages_sent || 0,
          messagesOpened: data.messages_opened || 0,
          replies: data.replies || 0,
          acceptanceRate: data.acceptance_rate || 0,
          replyRate: data.reply_rate || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch campaign metrics',
      };
    }
  },

  // 🚀 Start fetching leads
  startLeadFetching: async (lixCampaignId, targetingCriteria) => {
    try {
      const data = await callLixProxy(`/v1/campaigns/${lixCampaignId}/start-fetching`, 'POST', {
        targeting_criteria: targetingCriteria,
        max_leads: targetingCriteria.max_leads || 100,
        fetch_immediately: true,
      });

      return {
        success: true,
        data: {
          fetchingStarted: true,
          estimatedLeads: data.estimated_leads || 0,
          message: data.message || 'Lead fetching started successfully',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to start lead fetching',
      };
    }
  },

  // 🔐 Validate connection
  validateConnection: async () => {
    try {
      const data = await callLixProxy('/v1/auth/validate', 'GET');
      return {
        success: true,
        data: {
          valid: data.valid,
          account: data.account_info,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Validation failed',
      };
    }
  },
};

export default lixService;
