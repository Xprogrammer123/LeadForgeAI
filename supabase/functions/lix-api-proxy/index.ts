
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lixApiKey = Deno.env.get('LIX_API_KEY');
    const lixApiUrl = Deno.env.get('LIX_API_URL') || 'https://api.lix-it.com';

    if (!supabaseUrl || !supabaseServiceKey || !lixApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Get the authorization token from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Create a Supabase client to validate the user
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Parse the request
    const { endpoint, method = 'GET', body, queryParams } = await req.json();

    if (!endpoint) {
      throw new Error('Missing endpoint parameter');
    }

    // Build the full URL
    let fullUrl = `${lixApiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    if (queryParams) {
      const params = new URLSearchParams(queryParams);
      fullUrl += `?${params.toString()}`;
    }

    console.log('Lix API Proxy: Making request to:', fullUrl);

    // Prepare headers for Lix API
    const headers = {
      'Authorization': `Bearer ${lixApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'LeadForge-Supabase-Proxy/1.0',
    };

    // Make the request to Lix API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response;
    try {
      const fetchOptions = {
        method: method,
        headers: headers,
        signal: controller.signal,
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(body);
      }

      response = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }

    // Get response data
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log('Lix API Proxy: Response status:', response.status);

    // Return the response
    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Lix API Proxy Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        status: 500,
      }),
      {
        status: 200, // Always return 200 to avoid CORS issues, handle errors in response body
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
