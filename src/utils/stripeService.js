import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

/**
 * Enhanced Stripe service for credit purchasing and payment processing
 */
const stripeService = {
  /**
   * Create Stripe payment intent for credit purchase
   */
  createPaymentIntent: async (creditPackage, userEmail) => {
    try {
      // Validate inputs
      if (!creditPackage || !userEmail) {
        return { success: false, error: 'Missing required parameters' };
      }

      if (!creditPackage.id || !creditPackage.credits || !creditPackage.price) {
        return { success: false, error: 'Invalid credit package data' };
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        return { success: false, error: 'User not authenticated' };
      }

      // Enhanced error handling for the Edge Function call with absolute URL
      const response = await fetch('https://kgrbevxmtuhuenfqixsu.supabase.co/functions/v1/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creditPackage: {
            id: creditPackage.id,
            name: creditPackage.name,
            credits: creditPackage.credits,
            price: creditPackage.price,
            currency: creditPackage.currency || 'usd'
          },
          userEmail
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        return { 
          success: false, 
          error: 'Failed to create payment intent. Please check your internet connection and try again.' 
        };
      }

      const data = await response.json();

      if (!data?.clientSecret) {
        return { 
          success: false, 
          error: 'Invalid response from payment service' 
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      
      // Handle specific error types
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.name === 'TypeError' && error.message?.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to payment service. Please check your internet connection and try again.' 
        };
      }
      
      return { success: false, error: 'Failed to connect to payment service' };
    }
  },

  /**
   * Confirm payment using Stripe Payment Element
   */
  confirmPayment: async (clientSecret, paymentElement, billingDetails) => {
    try {
      const stripe = await getStripe();
      
      if (!stripe || !paymentElement) {
        return { success: false, error: 'Stripe not initialized' };
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: paymentElement,
        clientSecret,
        confirmParams: {
          payment_method_data: {
            billing_details: billingDetails
          }
        },
        redirect: 'if_required'
      });

      if (error) {
        return { 
          success: false, 
          error: error.message,
          type: error.type 
        };
      }

      return { 
        success: true, 
        data: { 
          paymentIntent,
          status: paymentIntent.status 
        } 
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Payment confirmation failed' };
    }
  },

  /**
   * Create Stripe checkout session (legacy method - kept for compatibility)
   */
  createCheckoutSession: async (creditPackage, userEmail) => {
    try {
      // For now, redirect to payment intent flow
      const result = await this.createPaymentIntent(creditPackage, userEmail);
      
      if (result.success) {
        // Return format expected by existing code
        return {
          success: true,
          data: {
            sessionId: result.data.clientSecret, // Pass client secret as session ID
            clientSecret: result.data.clientSecret,
            paymentIntentId: result.data.paymentIntentId
          }
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: 'Failed to create checkout session' };
    }
  },

  /**
   * Get available credit packages
   */
  getCreditPackages: () => {
    return [
      {
        id: 'prod_Slwk4ClJ0n51Kn',
        name: '100 Credits',
        credits: 100,
        price: 4000, // $40.00 in cents
        currency: 'usd',
        description: 'Perfect for testing campaigns',
        campaigns: '5 campaigns',
        popular: false
      },
      {
        id: 'prod_SmascDey3FleRf',
        name: '500 Credits', 
        credits: 500,
        price: 20000, // $180.00 in cents (10% discount)
        currency: 'usd',
        description: 'Great for regular use',
        campaigns: '25 campaigns',
        popular: true,
        savings: '$20'
      },
      {
        id: 'prod_SmaxQ90PFHP6gg',
        name: '1000 Credits',
        credits: 1000,
        price: 30000, // $300.00 in cents (25% discount)
        currency: 'usd',
        description: 'Best value for power users',
        campaigns: '50 campaigns',
        popular: false,
        savings: '$100'
      }
    ];
  },

  /**
   * Format price for display
   */
  formatPrice: (priceInCents, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100);
  },

  /**
   * Get Stripe publishable key
   */
  getPublishableKey: () => {
    return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  },

  /**
   * Initialize Stripe instance
   */
  getStripeInstance: async () => {
    return await getStripe();
  },

  /**
   * Legacy redirect method - updated for Payment Intent flow
   */
  redirectToCheckout: async (clientSecret) => {
    // This method is kept for compatibility but now we use embedded payments
    // Return the client secret for use with Payment Element
    return { success: true, clientSecret };
  },

  /**
   * Verify payment completion
   */
  verifyPayment: async (paymentIntentId) => {
    try {
      const stripe = await getStripe();
      
      if (!stripe) {
        return { success: false, error: 'Stripe not initialized' };
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(paymentIntentId);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data: { 
          paymentIntent,
          status: paymentIntent.status 
        } 
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { success: false, error: 'Failed to verify payment' };
    }
  },

  /**
   * Get customer's payment history from Supabase
   */
  getPaymentHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting payment history:', error);
      return { success: false, error: 'Failed to get payment history' };
    }
  }
};

export default stripeService;