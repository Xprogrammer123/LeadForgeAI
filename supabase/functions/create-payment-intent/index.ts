import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: corsHeaders
        });
    }

    try {
        // Validate environment variables first
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

        if (!supabaseUrl || !supabaseKey || !stripeKey) {
            console.error('Missing environment variables:', {
                supabaseUrl: !!supabaseUrl,
                supabaseKey: !!supabaseKey,
                stripeKey: !!stripeKey
            });
            throw new Error('Server configuration error: Missing required environment variables');
        }

        // Get the authorization token from the request headers
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // Create a Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        });

        // Create a Stripe client
        const stripe = new Stripe(stripeKey, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Get the request body
        let requestData;
        try {
            requestData = await req.json();
        } catch (error) {
            throw new Error('Invalid JSON in request body');
        }

        const { creditPackage, userEmail } = requestData;

        // Validate input data
        if (!creditPackage) {
            throw new Error('Credit package is required');
        }

        if (!creditPackage.id || !creditPackage.name || !creditPackage.credits || !creditPackage.price) {
            throw new Error('Invalid credit package data: missing required fields');
        }

        if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
            throw new Error('Valid user email is required');
        }

        // Get user information from the JWT token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            console.error('User authentication error:', userError?.message);
            throw new Error('Invalid user authentication');
        }

        console.log(`Creating payment intent for user ${user.id}, package: ${creditPackage.name}`);

        // Create a Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: creditPackage.price, // Amount in cents
            currency: creditPackage.currency || 'usd',
            automatic_payment_methods: { enabled: true },
            description: `Credit Purchase: ${creditPackage.name}`,
            statement_descriptor_suffix: 'AI SDR Credits',
            metadata: {
                user_id: user.id,
                user_email: userEmail,
                credit_package_id: creditPackage.id,
                credits_amount: creditPackage.credits.toString(),
                package_name: creditPackage.name,
                environment: Deno.env.get('ENVIRONMENT') || 'development'
            }
        });

        console.log(`Payment intent created: ${paymentIntent.id}`);

        // Create pending credit transaction record
        const { data: transaction, error: transactionError } = await supabase
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                transaction_type: 'purchase',
                credits_amount: creditPackage.credits,
                stripe_payment_intent_id: paymentIntent.id,
                amount_paid: creditPackage.price / 100, // Convert cents to dollars
                currency: (creditPackage.currency || 'USD').toUpperCase(),
                description: `Credit purchase: ${creditPackage.name}`
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Continue anyway, as this is not critical for payment flow
            // The webhook will handle the completion
        } else {
            console.log(`Transaction record created: ${transaction?.id}`);
        }

        // Return the payment intent client secret
        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            transactionId: transaction?.id || null,
            status: 'success'
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            status: 200
        });

    } catch (error) {
        console.error('Create payment intent error:', error.message);
        
        // Determine appropriate error status
        let status = 400;
        if (error.message.includes('Server configuration error')) {
            status = 500;
        } else if (error.message.includes('authentication')) {
            status = 401;
        }

        return new Response(JSON.stringify({
            error: error.message,
            status: 'error',
            timestamp: new Date().toISOString()
        }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            status
        });
    }
});