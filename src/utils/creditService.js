import { supabase } from './supabase';

/**
 * Credit management service for LinkedIn SDR campaigns
 */

const creditService = {
  /**
   * Get user's current credit balance by calculating from all credit purchases
   */
  getCreditBalance: async (userId) => {
    try {
      // Calculate balance from all credit transactions
      const { data: transactions, error } = await supabase
        .from('credit_transactions').select('transaction_type, credits_amount').eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Calculate balance from all transactions
      let balance = 0;
      transactions?.forEach(transaction => {
        if (transaction.transaction_type === 'purchase') {
          balance += transaction.credits_amount;
        } else if (transaction.transaction_type === 'deduction') {
          balance -= transaction.credits_amount;
        } else if (transaction.transaction_type === 'refund') {
          balance += transaction.credits_amount;
        }
      });

      // Also update user_profiles table to keep it in sync
      await supabase
        .from('user_profiles')
        .update({ credits: balance })
        .eq('id', userId);

      return { success: true, data: { credits: balance } };
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return { success: false, error: 'Failed to get credit balance' };
    }
  },

  /**
   * Check if user has enough credits for campaign
   */
  checkCreditSufficiency: async (userId, requiredCredits = 20) => {
    try {
      const result = await creditService.getCreditBalance(userId);
      
      if (!result.success) {
        return result;
      }

      const hasEnoughCredits = result.data.credits >= requiredCredits;
      
      return {
        success: true,
        data: {
          hasEnoughCredits,
          currentCredits: result.data.credits,
          requiredCredits,
          shortfall: hasEnoughCredits ? 0 : requiredCredits - result.data.credits
        }
      };
    } catch (error) {
      console.error('Error checking credit sufficiency:', error);
      return { success: false, error: 'Failed to check credit sufficiency' };
    }
  },

  /**
   * Deduct credits for campaign creation
   */
  deductCredits: async (userId, creditAmount = 20, description = 'Campaign creation') => {
    try {
      const { data, error } = await supabase.rpc('deduct_credits', {
        user_uuid: userId,
        credit_amount: creditAmount,
        description: description
      });

      if (error || !data) {
        return { 
          success: false, 
          error: error?.message || 'Insufficient credits' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, error: 'Failed to deduct credits' };
    }
  },

  /**
   * Add credits after successful payment
   */
  addCredits: async (userId, creditAmount, stripePaymentId, amountPaid) => {
    try {
      const { data, error } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        credit_amount: creditAmount,
        stripe_payment_id: stripePaymentId,
        amount_paid: amountPaid
      });

      if (error || !data) {
        return { 
          success: false, 
          error: error?.message || 'Failed to add credits' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, error: 'Failed to add credits' };
    }
  },

  /**
   * Get credit transaction history
   */
  getCreditTransactions: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error getting credit transactions:', error);
      return { success: false, error: 'Failed to get credit transactions' };
    }
  },

  /**
   * Calculate credits needed for campaign based on lead count
   */
  calculateCreditsNeeded: (leadCount) => {
    const CREDITS_PER_CAMPAIGN = 20;
    const CREDITS_PER_EXTRA_LEAD = 0.2; // 20 cents per lead after first 100
    
    let creditsNeeded = CREDITS_PER_CAMPAIGN;
    
    if (leadCount > 100) {
      const extraLeads = leadCount - 100;
      creditsNeeded += Math.ceil(extraLeads * CREDITS_PER_EXTRA_LEAD);
    }
    
    return creditsNeeded;
  },

  /**
   * Get credit usage statistics
   */
  getCreditStats: async (userId, timeRange = '30_days') => {
    try {
      let dateFilter = new Date();
      
      switch (timeRange) {
        case '7_days':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case '30_days':
          dateFilter.setDate(dateFilter.getDate() - 30);
          break;
        case '90_days':
          dateFilter.setDate(dateFilter.getDate() - 90);
          break;
        default:
          dateFilter.setDate(dateFilter.getDate() - 30);
      }

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('transaction_type, credits_amount, created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        totalPurchased: 0,
        totalUsed: 0,
        totalRefunded: 0,
        transactionCount: data?.length || 0
      };

      data?.forEach(transaction => {
        switch (transaction.transaction_type) {
          case 'purchase':
            stats.totalPurchased += transaction.credits_amount;
            break;
          case 'deduction':
            stats.totalUsed += transaction.credits_amount;
            break;
          case 'refund':
            stats.totalRefunded += transaction.credits_amount;
            break;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting credit stats:', error);
      return { success: false, error: 'Failed to get credit statistics' };
    }
  },

  /**
   * Process webhook for Stripe payment completion
   */
  processStripeWebhook: async (webhookData) => {
    try {
      const { type, data: eventData } = webhookData;
      
      if (type === 'checkout.session.completed') {
        const session = eventData.object;
        const { customer_email, metadata, amount_total } = session;
        
        // Extract credit amount from metadata
        const creditAmount = parseInt(metadata?.credits || '0');
        const userId = metadata?.user_id;
        
        if (userId && creditAmount > 0) {
          const result = await this.addCredits(
            userId, 
            creditAmount, 
            session.payment_intent,
            amount_total / 100 // Convert cents to dollars
          );
          
          if (!result.success) {
            console.error('Failed to process credit addition:', result.error);
            return { success: false, error: result.error };
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      return { success: false, error: 'Failed to process webhook' };
    }
  }
};

export default creditService;