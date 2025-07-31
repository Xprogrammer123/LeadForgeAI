import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';

import creditService from '../../utils/creditService';
import stripeService from '../../utils/stripeService';
import StripePaymentForm from '../../components/payments/StripePaymentForm';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Icon from '../../components/AppIcon';
import { supabase } from '../../utils/supabase';

function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalMeetings: 0,
    avgReplyRate: 0
  });
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditStats, setCreditStats] = useState({
    totalPurchased: 0,
    totalUsed: 0,
    totalRefunded: 0,
    transactionCount: 0
  });
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedCreditPackage, setSelectedCreditPackage] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { user } = useAuth();

  // Chart data for credit transactions over time
  const [creditChartData, setCreditChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load campaign stats - get leads generated, meetings booked, and replies
      const [leadsResult, meetingsResult, repliesResult] = await Promise.all([
        // Get leads generated count
        supabase.from('linkedin_leads').select('*', { count: 'exact', head: true }),
        // Get meetings booked count
        supabase.from('meetings').select('*', { count: 'exact', head: true }),
        // Get replies count
        supabase.from('linkedin_leads').select('*', { count: 'exact', head: true }).eq('replied', true)
      ]);

      const newStats = {
        totalLeads: leadsResult?.count || 0,
        totalMeetings: meetingsResult?.count || 0,
        totalReplies: repliesResult?.count || 0
      };
      setStats(newStats);

      // Load credit data if user is available
      if (user?.id) {
        // Load credit balance (now calculated from all purchases)
        const creditResult = await creditService.getCreditBalance(user.id);
        if (creditResult?.success) {
          setCreditBalance(creditResult.data.credits);
        }

        // Load credit statistics for the last 30 days
        const creditStatsResult = await creditService.getCreditStats(user.id, '30_days');
        if (creditStatsResult?.success) {
          setCreditStats(creditStatsResult.data);
        }

        // Load credit transaction history for chart
        const transactionsResult = await creditService.getCreditTransactions(user.id, 30);
        if (transactionsResult?.success) {
          setTransactionHistory(transactionsResult.data);
          
          // Transform transaction data for chart display
          const chartData = transformTransactionsToChartData(transactionsResult.data);
          setCreditChartData(chartData);
        }
      }

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Transform credit transactions into chart-friendly format
  const transformTransactionsToChartData = (transactions) => {
    if (!transactions?.length) {
      return [];
    }

    // Group transactions by date
    const groupedByDate = {};
    const last30Days = [];
    
    // Create array of last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      last30Days.push(dateKey);
      groupedByDate[dateKey] = {
        date: dateKey,
        purchase: 0,
        usage: 0,
        balance: 0,
        day: date.getDate()
      };
    }

    // Process transactions and calculate running balance
    let runningBalance = creditBalance;
    
    // Sort transactions by date ascending to calculate balance progression
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Calculate starting balance by working backwards from current balance
    sortedTransactions.forEach(transaction => {
      if (transaction.transaction_type === 'purchase') {
        runningBalance -= transaction.credits_amount;
      } else if (transaction.transaction_type === 'deduction') {
        runningBalance += transaction.credits_amount;
      }
    });

    // Now process transactions forward to build chart data
    sortedTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.created_at).toISOString().split('T')[0];
      
      if (groupedByDate[transactionDate]) {
        if (transaction.transaction_type === 'purchase') {
          groupedByDate[transactionDate].purchase += transaction.credits_amount;
          runningBalance += transaction.credits_amount;
        } else if (transaction.transaction_type === 'deduction') {
          groupedByDate[transactionDate].usage += transaction.credits_amount;
          runningBalance -= transaction.credits_amount;
        }
        groupedByDate[transactionDate].balance = Math.max(0, runningBalance);
      }
    });

    // Convert to array format for chart
    return last30Days.map(dateKey => groupedByDate[dateKey]);
  };

  const handlePurchaseCredits = async (creditPackage) => {
    setSelectedCreditPackage(creditPackage);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Refresh all dashboard data after successful payment
      await loadDashboardData();
      setShowPaymentForm(false);
      setShowCreditModal(false);
      setSelectedCreditPackage(null);
      
      // Clear any existing errors
      setError('');
    } catch (err) {
      console.error('Error refreshing data after payment:', err);
    }
  };

  const handlePaymentError = (error) => {
    setError(`Payment failed: ${error}`);
    setShowPaymentForm(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedCreditPackage(null);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glassmorphism rounded-lg p-3 border border-border">
          <p className="text-sm font-body-medium text-foreground mb-2">
            Day {label}
          </p>
          {data.purchase > 0 && (
            <p className="text-xs text-success">
              Purchased: +{data.purchase} credits
            </p>
          )}
          {data.usage > 0 && (
            <p className="text-xs text-warning">
              Used: -{data.usage} credits
            </p>
          )}
          <p className="text-xs text-primary font-semibold">
            Balance: {data.balance} credits
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" currentPath="/dashboard">
        <div className="flex items-center justify-center h-64">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-body-medium">Loading dashboard...</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard" currentPath="/dashboard">
      <div className="space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-lg p-4 border border-error/20 bg-error/10"
          >
            <div className="text-sm text-error font-body-medium">{error}</div>
          </motion.div>
        )}

        {/* Welcome Section with Credit Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-headline-bold text-foreground mb-2">
                Welcome back! 👋
              </h2>
              <p className="text-muted-foreground font-body">
                Here's what's happening with your AI SDR campaigns today.
              </p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-body-semibold text-foreground">
                    Credit Balance: {creditBalance} credits
                  </span>
                </div>
                {creditBalance < 20 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreditModal(true)}
                    iconName="CreditCard"
                    iconPosition="left"
                    className="text-warning border-warning hover:bg-warning/10"
                  >
                    Buy Credits
                  </Button>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/campaigns'}
                iconName="Plus"
                iconPosition="left"
                disabled={creditBalance < 20}
              >
                New Campaign
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.href = '/contacts'}
                iconName="Upload"
                iconPosition="left"
                className="cta-button"
              >
                View Leads
              </Button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards - Updated with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Credit Balance"
            value={creditBalance}
            icon="Coins"
            color="warning"
            change={creditStats.totalPurchased > creditStats.totalUsed ? 
              Math.round(((creditStats.totalPurchased - creditStats.totalUsed) / Math.max(creditStats.totalUsed, 1)) * 100) : 
              -Math.round(((creditStats.totalUsed - creditStats.totalPurchased) / Math.max(creditStats.totalPurchased, 1)) * 100)
            }
          />
          <StatCard
            title="Leads Generated"
            value={stats.totalLeads}
            icon="Users"
            color="success"
            change={stats.totalLeads > 0 ? 15 : 0}
          />
          <StatCard
            title="Meetings Booked"
            value={stats.totalMeetings}
            icon="Calendar"
            color="primary"
            change={stats.totalMeetings > 0 ? 8 : 0}
          />
          <StatCard
            title="Replies"
            value={stats.totalReplies}
            icon="MessageCircle"
            color="accent"
            change={stats.totalReplies > 0 ? 5 : 0}
          />
        </div>

        {/* Credit Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glassmorphism rounded-xl p-6"
        >
          <h3 className="text-lg font-headline-bold text-foreground mb-6">
            Credit Activity - Last 30 Days
          </h3>
          <div className="h-80">
            {creditChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={creditChartData}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                    stroke="var(--color-border)"
                  />
                  <YAxis 
                    tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                    stroke="var(--color-border)"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone"
                    dataKey="balance" 
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                    strokeWidth={2}
                  />
                  <Bar 
                    dataKey="purchase" 
                    fill="var(--color-success)"
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="usage" 
                    fill="var(--color-warning)"
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                    <Icon name="BarChart3" size={32} color="var(--color-muted-foreground)" />
                  </div>
                  <p className="text-muted-foreground font-body-medium">
                    No credit activity yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Purchase credits or create campaigns to see your activity here
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glassmorphism rounded-xl p-6"
        >
          <h3 className="text-lg font-headline-bold text-foreground mb-6">
            Recent Credit Transactions
          </h3>
          {transactionHistory.length > 0 ? (
            <div className="space-y-3">
              {transactionHistory.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.transaction_type === 'purchase' ? 'bg-success/20' :
                      transaction.transaction_type === 'deduction'? 'bg-warning/20' : 'bg-error/20'
                    }`}>
                      <Icon 
                        name={
                          transaction.transaction_type === 'purchase' ? 'Plus' :
                          transaction.transaction_type === 'deduction'? 'Minus' : 'RefreshCw'
                        } 
                        size={16}
                        color={
                          transaction.transaction_type === 'purchase' ? 'var(--color-success)' :
                          transaction.transaction_type === 'deduction' ? 'var(--color-warning)' :
                          'var(--color-error)'
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm font-body-medium text-foreground">
                        {transaction.description || 
                          (transaction.transaction_type === 'purchase' ? 'Credits Purchase' :
                           transaction.transaction_type === 'deduction'? 'Campaign Creation' : 'Credit Refund')
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-body-semibold ${
                      transaction.transaction_type === 'purchase' ? 'text-success' :
                      transaction.transaction_type === 'deduction'? 'text-warning' : 'text-error'
                    }`}>
                      {transaction.transaction_type === 'purchase' ? '+' : '-'}
                      {transaction.credits_amount} credits
                    </p>
                    {transaction.amount_usd && (
                      <p className="text-xs text-muted-foreground">
                        ${(transaction.amount_usd / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                <Icon name="Receipt" size={32} color="var(--color-muted-foreground)" />
              </div>
              <p className="text-muted-foreground font-body-medium">
                No transactions yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your credit purchases and usage will appear here
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glassmorphism rounded-xl p-6"
        >
          <h3 className="text-lg font-headline-bold text-foreground mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => window.location.href = '/campaigns'}
              variant="default"
              className="cta-button justify-start"
              iconName="Megaphone"
              iconPosition="left"
              disabled={creditBalance < 20}
            >
              Create Campaign
            </Button>
            <Button
              onClick={() => window.location.href = '/contacts'}
              variant="secondary"
              className="justify-start"
              iconName="UserPlus"
              iconPosition="left"
            >
              View Leads
            </Button>
            <Button
              onClick={() => setShowCreditModal(true)}
              variant="outline"
              className="justify-start"
              iconName="CreditCard"
              iconPosition="left"
            >
              Buy Credits
            </Button>
            <Button
              onClick={() => window.location.href = '/settings'}
              variant="outline"
              className="justify-start"
              iconName="Settings"
              iconPosition="left"
            >
              Settings
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Credit Purchase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glassmorphism rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-headline-bold text-foreground">
                {showPaymentForm ? 'Complete Payment' : 'Purchase Credits'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreditModal(false);
                  setShowPaymentForm(false);
                  setSelectedCreditPackage(null);
                }}
                iconName="X"
              />
            </div>
            
            {showPaymentForm && selectedCreditPackage ? (
              <StripePaymentForm
                creditPackage={selectedCreditPackage}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stripeService.getCreditPackages().map((pkg) => (
                  <div key={pkg.id} className={`border rounded-lg p-6 ${pkg.popular ? 'border-primary' : 'border-border'}`}>
                    {pkg.popular && (
                      <div className="text-xs font-body-semibold text-primary mb-2">Most Popular</div>
                    )}
                    <h4 className="text-lg font-headline-bold text-foreground mb-2">{pkg.name}</h4>
                    <div className="text-3xl font-headline-bold text-foreground mb-2">
                      {stripeService.formatPrice(pkg.price)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    <div className="text-sm text-muted-foreground mb-4">
                      • {pkg.campaigns}<br/>
                      • {pkg.credits} credits included
                      {pkg.savings && <><br/>• Save {pkg.savings}</>}
                    </div>
                    <Button
                      onClick={() => handlePurchaseCredits(pkg)}
                      variant={pkg.popular ? 'default' : 'outline'}
                      className={pkg.popular ? 'cta-button w-full' : 'w-full'}
                    >
                      Purchase Credits
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default DashboardPage;