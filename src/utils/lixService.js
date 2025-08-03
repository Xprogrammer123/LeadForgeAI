

const getBaseUrl = () => {
  // Use environment variable for Lix API URL, default to real Lix API
  return import.meta.env.VITE_LIX_API_URL || 'https://api.lix-it.com';
};

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  console.log('Lix API: Making real API call to:', fullUrl);

  for (let i = 0; i < retries; i++) {
    let controller;
    let timeoutId;
    
    try {
      // Add timeout to prevent hanging requests
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        console.log(`Request timeout after 30 seconds, attempt ${i + 1}`);
        controller.abort();
      }, 30000); // 30 second timeout

      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error(`Fetch attempt ${i + 1} failed:`, error);

      // Handle different error types
      if (error.name === 'AbortError') {
        console.error('Request was aborted (timeout or manual cancel)');
        if (i === retries - 1) {
          throw new Error('Request timeout - please check your internet connection and the API endpoint');
        }
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('Network error - unable to reach the API');
        if (i === retries - 1) {
          throw new Error('Network error - unable to reach Lix API. Please check the VITE_LIX_API_URL environment variable.');
        }
      } else {
        // For other errors, throw immediately
        throw error;
      }

      // Wait before retrying (exponential backoff)
      console.log(`Waiting ${Math.pow(2, i)} seconds before retry...`);
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Check if API key is configured
const validateApiKey = () => {
  const apiKey = import.meta.env.VITE_LIX_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Lix API key is not configured. Please set VITE_LIX_API_KEY in your environment variables.');
  }
  console.log('Lix API: Using API key:', apiKey.substring(0, 10) + '...');
  return apiKey;
};

const lixService = {
  /**
   * Search for LinkedIn leads based on filters
   */
  searchLeads: async (filters) => {
    try {
      console.log('Lix API: Starting lead search with filters:', filters);
      
      const apiKey = validateApiKey();

      // Build query parameters with enhanced filtering
      const queryParams = new URLSearchParams({
        job_titles: filters.jobTitles?.join(',') || '',
        industries: filters.industries?.join(',') || '',
        locations: filters.locations?.join(',') || '',
        company_sizes: filters.companySizes?.join(',') || '',
        experience_levels: filters.experienceLevels?.join(',') || '',
        limit: filters.limit || 50,
        include_email: 'true', // Request email data if available
        include_phone: 'true', // Request phone data if available
        verified_only: 'false', // Include both verified and unverified leads
      });

      console.log('Lix API: Making request to /v1/li/linkedin/search/people with params:', queryParams.toString());

      const startTime = Date.now();
      const response = await fetchWithRetry(`/v1/li/linkedin/search/people?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Request-Source': 'leadforge-campaign-creation',
          'User-Agent': 'LeadForge/1.0',
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(`Lix API: Response received in ${responseTime}ms, status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = 'Failed to search leads';
        let errorDetails = null;
        
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          errorDetails = error.details || null;
          console.error('Lix API Error Response:', error);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error('Lix API: Failed to parse error response:', e);
        }
        
        return { 
          success: false, 
          error: errorMessage,
          details: errorDetails,
          statusCode: response.status
        };
      }

      const data = await response.json();
      console.log('Lix API: Raw response data:', {
        leadsCount: data.leads?.length || 0,
        total: data.total,
        hasMore: data.hasMore
      });

      // Transform Lix API response to our format with enhanced data mapping
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
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please check your internet connection';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
        errorCode = 'AUTH_ERROR';
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry('/v1/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: leadId,
          message: message,
          campaign_id: campaignId,
          message_type: 'direct_message',
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
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
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry(`/v1/messages/inbox?campaign_id=${campaignId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get inbox messages';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

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
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry('/v1/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: campaignData.name,
          description: campaignData.message,
          target_filters: {
            job_titles: campaignData.target_job_titles,
            industries: campaignData.target_industries,
            locations: campaignData.target_locations,
          },
          message_template: campaignData.message_template,
          daily_limit: 50, // LinkedIn daily message limit
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create Lix campaign';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
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
      
      if (error.message.includes('Request timeout')) {
        errorMessage = 'Request timeout - Lix API is not responding';
        troubleshooting = 'Please verify your VITE_LIX_API_URL is correct and the API is accessible.';
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Cannot connect to Lix API';
        troubleshooting = 'Please check your VITE_LIX_API_URL environment variable and internet connection.';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request was cancelled or timed out';
        troubleshooting = 'The API request took too long to respond.';
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry(`/v1/campaigns/${lixCampaignId}/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get campaign metrics';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
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
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry(`/v1/campaigns/${lixCampaignId}/start-fetching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          targeting_criteria: targetingCriteria,
          max_leads: targetingCriteria.max_leads || 100,
          fetch_immediately: true
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to start lead fetching';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
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
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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
      const apiKey = validateApiKey();

      const response = await fetchWithRetry('/v1/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Invalid Lix API key' };
      }

      const data = await response.json();
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
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout - please check your internet connection';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
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