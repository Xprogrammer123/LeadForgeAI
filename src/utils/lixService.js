import { supabase } from './supabase';
import campaignService from './campaignService';

// 🔐 ENV-SAFE KEYS
const SUPABASE_PROJECT_URL = 'https://kgrbevxmtuhuenfqixsu.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// 🔁 Proxy Lix API via Edge Function
const callLixProxy = async (endpoint, method = 'GET', body = null, queryParams = null) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session. Please log in.');

    let url = `/.netlify/functions${endpoint}`;
    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
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
  // 🔹 Search for leads from Lix
  searchLeads: async (filters) => {
    try {
      const queryParams = {
        job_titles: filters.jobTitles?.join(',') || '',
        industries: filters.industries?.join(',') || '',
        locations: filters.locations?.join(',') || '',
        company_sizes: filters.companySizes?.join(',') || '',
        experience_levels: filters.experienceLevels?.join(',') || '',
        limit: filters.limit || 5,
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

  // 🔹 Start fetching leads & mark campaign as completed
  startLeadFetching: async (lixCampaignId, targetingCriteria, campaignId) => {
    try {
      const data = await callLixProxy(`/v1/li/linkedin/search/people/${lixCampaignId}`, 'POST', {
        targeting_criteria: targetingCriteria,
        max_leads: targetingCriteria.max_leads || 100,
        fetch_immediately: true,
      });

      if (campaignId) {
        await campaignService.updateCampaignStatus(campaignId, 'completed');
      }

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

  // 🔹 Validate Lix API connection
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
