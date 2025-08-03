import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
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
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!supabaseUrl || !supabaseServiceKey || !stripeKey || !webhookSecret) {
            console.error('Missing environment variables:', {
                supabaseUrl: !!supabaseUrl,
                supabaseServiceKey: !!supabaseServiceKey,
                stripeKey: !!stripeKey,
                webhookSecret: !!webhookSecret
            });
            throw new Error('Server configuration error: Missing required environment variables');
        }

        // Create a Supabase client with service role key for admin operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Create a Stripe client
        const stripe = new Stripe(stripeKey, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Get the raw body and signature
        const body = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            console.error('Missing Stripe signature header');
            throw new Error('Missing Stripe signature');
        }

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            console.log(`Webhook event received: ${event.type} - ${event.id}`);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return new Response(JSON.stringify({ 
                error: 'Invalid signature',
                message: err.message 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Handle payment intent success
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata
                ;

            console.log(`Payment succeeded: ${paymentIntent.id}`, metadata);

            const userId = metadata.user_id;
            const creditsAmount = parseInt(metadata.credits_amount);
            const amountPaid = paymentIntent.amount / 100; // Convert cents to dollars

            if (!userId || !creditsAmount || isNaN(creditsAmount)) {
                console.error('Missing or invalid metadata:', metadata);
                return new Response(JSON.stringify({ 
                    error: 'Invalid metadata',
                    received: false 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                });
            }

            // Add credits to user account using the database function
            const { data, error } = await supabase.rpc('add_credits', {
                user_uuid: userId,
                credit_amount: creditsAmount,
                stripe_payment_id: paymentIntent.id,
                amount_paid: amountPaid
            });

            if (error) {
                console.error('Error adding credits:', error);
                return new Response(JSON.stringify({ 
                    error: 'Failed to add credits',
                    details: error.message,
                    received: false 
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 500
                });
            }

            // Update transaction record to mark as completed
            const { error: updateError } = await supabase
                .from('credit_transactions')
                .update({ 
                    description: `Credit purchase completed: ${metadata.package_name || 'Unknown package'}`,
                    created_at: new Date().toISOString()
                })
                .eq('stripe_payment_intent_id', paymentIntent.id);

            if (updateError) {
                console.error('Error updating transaction record:', updateError);
                // Continue anyway as the credits were added successfully
            }

            console.log(`Successfully added ${creditsAmount} credits to user ${userId}`);
        }

        // Handle payment intent failure
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const metadata = paymentIntent.metadata;
            
            console.log('Payment failed:', {
                paymentIntentId: paymentIntent.id,
                userId: metadata.user_id,
                amount: paymentIntent.amount,
                error: paymentIntent.last_payment_error?.message
            });
            
            // Update transaction record with failure status
            if (metadata.user_id) {
                const { error: updateError } = await supabase
                    .from('credit_transactions')
                    .update({ 
                        description: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
                    })
                    .eq('stripe_payment_intent_id', paymentIntent.id);

                if (updateError) {
                    console.error('Error updating failed transaction:', updateError);
                }
            }
        }

        // Handle other relevant events
        if (event.type === 'payment_intent.canceled') {
            const paymentIntent = event.data.object;
            console.log(`Payment canceled: ${paymentIntent.id}`);
            
            // Update transaction record
            const { error: updateError } = await supabase
                .from('credit_transactions')
                .update({ 
                    description: 'Payment canceled by user or system'
                })
                .eq('stripe_payment_intent_id', paymentIntent.id);

            if (updateError) {
                console.error('Error updating canceled transaction:', updateError);
            }
        }

        console.log(`Webhook processed successfully: ${event.type}`);

        return new Response(JSON.stringify({ 
            received: true,
            event_type: event.type,
            event_id: event.id,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Webhook processing error:', error.message);
        
        let status = 500;
        if (error.message.includes('Server configuration error')) {
            status = 503; // Service Unavailable
        }

        return new Response(JSON.stringify({ 
            error: error.message,
            received: false,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status
        });
    }
});