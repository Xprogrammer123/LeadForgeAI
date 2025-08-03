import { supabase } from './supabase';

const callLixProxy = async (endpoint, method = 'GET', body = null, queryParams = null) => {
  try {
    // Get the current session to include auth token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session. Please log in.');
    }

    console.log('Lix Service: Making request via Supabase Edge Function');
    console.log('Endpoint:', endpoint);
    console.log('Method:', method);

    const { data, error } = await supabase.functions.invoke('lix-api-proxy', {
      body: {
        endpoint,
        method,
        body,
        queryParams
      },
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to call Lix API proxy');
    }

    console.log('Lix Service: Response received', { success: data?.success, status: data?.status });

    if (!data.success) {
      throw new Error(data.error || `HTTP ${data.status}: Request failed`);
    }

    return data.data;
  } catch (error) {
    console.error('Lix Service Error:', error);
    throw error;
  }
};

const lixService = {
  /**
   * Search for LinkedIn leads based on filters
   */
  searchLeads: async (filters) => {
    try {
      console.log('Lix API: Starting lead search with filters:', filters);

      // Build query parameters with enhanced filtering
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

      console.log('Lix API: Making request to /v1/li/linkedin/search/people');

      const startTime = Date.now();
      const data = await callLixProxy('/v1/li/linkedin/search/people', 'GET', null, queryParams);
      const responseTime = Date.now() - startTime;

      console.log(`Lix API: Response received in ${responseTime}ms`);
      console.log('Lix API: Raw response data:', {
        leadsCount: data.leads?.length || 0,
        total: data.total,
        hasMore: data.hasMore
      });

      // Transform Lix API response to our format
      const leads = data.leads?.map((lead, index) => {
        console.log(`Lix API: Processing lead ${index + 1}:`, {
          name: lead.name,
          jobTitle: lead.jobTitle,
          company: lead.companyName
        });

        return {
          full_name: lead.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || `Lead ${index + 1}`,
          job_title: lead.jobTitle || lead.position || 'Unknown Position',
          company: lead.companyName || lead.company || 'Unknown Company',
          location: lead.location || lead.city || lead.country || 'Unknown Location',
          linkedin_url: lead.linkedinUrl || lead.profileUrl || '',
          email: lead.email || lead.emailAddress || null,
          phone: lead.phone || lead.phoneNumber || null,
          profile_image_url: lead.profileImageUrl || lead.avatarUrl || null,
          lix_lead_id: lead.id || lead.leadId || `temp_${Date.now()}_${index}`,
          lead_data: {
            industry: lead.industry || null,
            companySize: lead.companySize || null,
            experience: lead.experience || lead.yearsOfExperience || null,
            connections: lead.connections || lead.connectionCount || null,
            verified: lead.verified || false,
            seniority: lead.seniority || null,
            department: lead.department || null,
            skills: lead.skills || [],
            lastActivity: lead.lastActivity || null,
          },
        };
      }) || [];

      console.log(`Lix API: Successfully transformed ${leads.length} leads`);

      return {
        success: true,
        data: {
          leads,
          total: data.total || leads.length,
          hasMore: data.hasMore || false,
          searchTime: responseTime,
          filtersApplied: {
            jobTitles: filters.jobTitles?.length || 0,
            industries: filters.industries?.length || 0,
            locations: filters.locations?.length || 0,
          }
        },
      };
    } catch (error) {
      console.error('Lix API: Error searching leads:', error);

      let errorMessage = 'Failed to connect to Lix API';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
        errorCode = 'AUTH_ERROR';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please check your internet connection';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your internet connection and try again';
        errorCode = 'NETWORK_ERROR';
      }

      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        retryable: errorCode !== 'AUTH_ERROR',
      };
    }
  },

  /**
   * Send LinkedIn message through Lix API
   */
  sendLinkedInMessage: async (leadId, message, campaignId) => {
    try {
      const data = await callLixProxy('/v1/messages/send', 'POST', {
        recipient_id: leadId,
        message: message,
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
      console.error('Error sending LinkedIn message:', error);

      let errorMessage = 'Failed to send LinkedIn message';
      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get LinkedIn inbox messages and replies
   */
  getInboxMessages: async (campaignId) => {
    try {
      const data = await callLixProxy(`/v1/messages/inbox`, 'GET', null, { campaign_id: campaignId });

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

      return {
        success: true,
        data: { messages },
      };
    } catch (error) {
      console.error('Error getting inbox messages:', error);

      let errorMessage = 'Failed to get inbox messages';
      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Create campaign in Lix system
   */
  createLixCampaign: async (campaignData) => {
    try {
      const data = await callLixProxy('/v1/campaigns', 'POST', {
        name: campaignData.name,
        description: campaignData.message,
        target_filters: {
          job_titles: campaignData.target_job_titles,
          industries: campaignData.target_industries,
          locations: campaignData.target_locations,
        },
        message_template: campaignData.message_template,
        daily_limit: 50,
      });

      return {
        success: true,
        data: {
          lixCampaignId: data.campaign_id,
          status: data.status,
        },
      };
    } catch (error) {
      console.error('Error creating Lix campaign:', error);

      let errorMessage = 'Failed to create Lix campaign';
      let troubleshooting = '';

      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - Lix API is not responding';
        troubleshooting = 'The API request took too long to respond.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Cannot connect to Lix API';
        troubleshooting = 'Please check your internet connection.';
      }

      console.error('Lix API troubleshooting:', troubleshooting);

      return {
        success: false,
        error: errorMessage,
        troubleshooting: troubleshooting,
      };
    }
  },

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
      console.error('Error getting campaign metrics:', error);

      let errorMessage = 'Failed to get campaign metrics';
      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Start LinkedIn lead fetching for a campaign
   */
  startLeadFetching: async (lixCampaignId, targetingCriteria) => {
    try {
      const data = await callLixProxy(`/v1/campaigns/${lixCampaignId}/start-fetching`, 'POST', {
        targeting_criteria: targetingCriteria,
        max_leads: targetingCriteria.max_leads || 100,
        fetch_immediately: true
      });

      return {
        success: true,
        data: {
          fetchingStarted: true,
          estimatedLeads: data.estimated_leads || 0,
          message: data.message || 'Lead fetching started successfully'
        },
      };
    } catch (error) {
      console.error('Error starting lead fetching:', error);

      let errorMessage = 'Failed to start lead fetching';
      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Validate Lix API connection
   */
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
      console.error('Error validating Lix connection:', error);

      let errorMessage = 'Failed to validate Lix API connection';
      if (error.message.includes('No active session')) {
        errorMessage = 'Please log in to continue';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout - please check your internet connection';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - unable to connect to Lix API';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

export default lixService;