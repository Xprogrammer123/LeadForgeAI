import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import Button from '../../components/ui/Button';
import campaignService from '../../utils/campaignService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalMeetings: 0,
    avgReplyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Mock data for leads over 30 days
  const leadsData = [
    { day: '1', leads: 12 },
    { day: '5', leads: 19 },
    { day: '10', leads: 25 },
    { day: '15', leads: 22 },
    { day: '20', leads: 28 },
    { day: '25', leads: 35 },
    { day: '30', leads: 42 }
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaignStats();
      
      if (result?.success) {
        setStats(result.data);
      } else {
        setError(result?.error || 'Failed to load statistics');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glassmorphism rounded-lg p-3 border border-border">
          <p className="text-sm font-body-medium text-foreground">
            Day {label}: {payload[0].value} leads
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

        {/* Welcome Section */}
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
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/campaigns'}
                iconName="Plus"
                iconPosition="left"
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
                Import Contacts
              </Button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Leads Generated"
            value={stats.totalLeads}
            icon="Users"
            color="primary"
            change={12}
          />
          <StatCard
            title="Meetings Booked"
            value={stats.totalMeetings}
            icon="Calendar"
            color="secondary"
            change={8}
          />
          <StatCard
            title="Reply Rate"
            value={`${stats.avgReplyRate.toFixed(1)}%`}
            icon="MessageCircle"
            color="accent"
            change={-2}
          />
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glassmorphism rounded-xl p-6"
        >
          <h3 className="text-lg font-headline-bold text-foreground mb-6">
            Leads Generated - Last 30 Days
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsData}>
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
                <Bar 
                  dataKey="leads" 
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => window.location.href = '/campaigns'}
              variant="default"
              className="cta-button justify-start"
              iconName="Megaphone"
              iconPosition="left"
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
              Import Contacts
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
    </DashboardLayout>
  );
}

export default DashboardPage;