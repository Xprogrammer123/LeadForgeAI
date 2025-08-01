/**
 * Lix API service for LinkedIn lead generation
 * Handles lead fetching, campaign management, and messaging
 * Updated to use direct HTTPS Lix API calls
 */

const getBaseUrl = () => {
  // Use environment variable for Lix API URL, default to a placeholder
  return process.env.VITE_LIX_API_URL || 'https://api.lix-service.com'; // Replace with actual Lix API URL
};

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  for (let i = 0; i < retries; i++) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error);

      // If it's the last retry or not a network error, throw the error
      if (i === retries - 1 || error.name !== 'TypeError') {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Check if API key is configured
const validateApiKey = () => {
  const apiKey = import.meta.env.VITE_LIX_API_KEY;
  if (!apiKey) {
    throw new Error('Lix API key is not configured. Please check your environment variables.');
  }
  return apiKey;
};

const lixService = {
  /**
   * Search for LinkedIn leads based on filters
   */
  searchLeads: async (filters) => {
    try {
      const apiKey = validateApiKey();

      const queryParams = new URLSearchParams({
        job_titles: filters.jobTitles?.join(',') || '',
        industries: filters.industries?.join(',') || '',
        locations: filters.locations?.join(',') || '',
        company_sizes: filters.companySizes?.join(',') || '',
        experience_levels: filters.experienceLevels?.join(',') || '',
        limit: filters.limit || 50,
      });

      const response = await fetchWithRetry(`/leads/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to search leads';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      // Transform Lix API response to our format
      const leads = data.leads?.map((lead) => ({
        full_name: lead.name || `${lead.firstName} ${lead.lastName}`,
        job_title: lead.jobTitle,
        company: lead.companyName,
        location: lead.location,
        linkedin_url: lead.linkedinUrl,
        email: lead.email,
        phone: lead.phone,
        profile_image_url: lead.profileImageUrl,
        lix_lead_id: lead.id,
        lead_data: {
          industry: lead.industry,
          companySize: lead.companySize,
          experience: lead.experience,
          connections: lead.connections,
          verified: lead.verified,
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
      console.error('Error searching leads:', error);

      let errorMessage = 'Failed to connect to Lix API';
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please check your internet connection';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Network error - please check your internet connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Send LinkedIn message through Lix API
   */
  sendLinkedInMessage: async (leadId, message, campaignId) => {
    try {
      const apiKey = validateApiKey();

      const response = await fetchWithRetry('/messages/send', {
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

      const response = await fetchWithRetry(`/messages/inbox?campaign_id=${campaignId}`, {
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

      const response = await fetchWithRetry('/campaigns', {
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
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('API key')) {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = 'Network error - please check your internet connection and try again';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  getCampaignMetrics: async (lixCampaignId) => {
    try {
      const apiKey = validateApiKey();

      const response = await fetchWithRetry(`/campaigns/${lixCampaignId}/metrics`, {
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
   * Validate Lix API connection
   */
  validateConnection: async () => {
    try {
      const apiKey = validateApiKey();

      const response = await fetchWithRetry('/auth/validate', {
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