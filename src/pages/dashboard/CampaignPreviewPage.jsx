
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import campaignService from '../../utils/campaignService';
import lixService from '../../utils/lixService';

function CampaignPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      
      // Load campaign details
      const campaignResult = await campaignService.getCampaignById(id);
      if (!campaignResult.success) {
        setError('Failed to load campaign details');
        return;
      }
      
      setCampaign(campaignResult.data);
      
      // Load campaign metrics from Lix
      if (campaignResult.data.lix_campaign_id) {
        const metricsResult = await lixService.getCampaignMetrics(campaignResult.data.lix_campaign_id);
        if (metricsResult.success) {
          setMetrics(metricsResult.data);
        }
      }
      
      // Load leads for this campaign
      const leadsResult = await campaignService.getCampaignLeads(id);
      if (leadsResult.success) {
        setLeads(leadsResult.data);
      }
      
    } catch (err) {
      console.error('Error loading campaign data:', err);
      setError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFetching = async () => {
    try {
      setError('');
      
      // Start LinkedIn lead fetching process
      const result = await lixService.startLeadFetching(campaign.lix_campaign_id, {
        target_job_titles: campaign.target_job_titles,
        target_industries: campaign.target_industries,
        target_locations: campaign.target_locations,
        max_leads: 100 // Default limit
      });

      if (result.success) {
        // Update campaign status to indicate fetching has started
        await campaignService.updateCampaign(campaign.id, { 
          status: 'fetching_leads',
          fetching_started_at: new Date().toISOString()
        });
        
        // Reload campaign data
        loadCampaignData();
      } else {
        setError('Failed to start lead fetching: ' + result.error);
      }
    } catch (err) {
      console.error('Error starting lead fetching:', err);
      setError('An error occurred while starting lead fetching');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border-success/30';
      case 'fetching_leads':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'paused':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
      case 'draft':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Campaign Preview" currentPath="/campaigns">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout title="Campaign Preview" currentPath="/campaigns">
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} color="var(--color-error)" className="mx-auto mb-4" />
          <h2 className="text-xl font-headline-bold text-foreground mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-4">The campaign you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/campaigns')} variant="default">
            Back to Campaigns
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Campaign Preview" currentPath="/campaigns">
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/campaigns')}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-headline-bold text-foreground">{campaign.name}</h2>
              <p className="text-muted-foreground font-body">Campaign Details & Performance</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 text-sm font-body-medium rounded-full border ${getStatusColor(campaign.status)}`}>
              {campaign.status.replace('_', ' ')}
            </span>
            {campaign.status === 'active' && !campaign.fetching_started_at && (
              <Button
                onClick={handleStartFetching}
                variant="default"
                className="cta-button"
                iconName="Play"
                iconPosition="left"
              >
                Start Fetching Leads
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="glassmorphism rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: 'overview', label: 'Overview', icon: 'BarChart3' },
              { id: 'targeting', label: 'Targeting', icon: 'Target' },
              { id: 'message', label: 'Message', icon: 'MessageSquare' },
              { id: 'leads', label: 'Leads', icon: 'Users' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-body-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glassmorphism rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Messages Sent</p>
                        <p className="text-2xl font-headline-bold text-foreground">
                          {metrics?.messagesSent || 0}
                        </p>
                      </div>
                      <Icon name="Send" size={24} color="var(--color-primary)" />
                    </div>
                  </div>
                  
                  <div className="glassmorphism rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Replies</p>
                        <p className="text-2xl font-headline-bold text-foreground">
                          {metrics?.replies || 0}
                        </p>
                      </div>
                      <Icon name="MessageCircle" size={24} color="var(--color-success)" />
                    </div>
                  </div>
                  
                  <div className="glassmorphism rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Reply Rate</p>
                        <p className="text-2xl font-headline-bold text-foreground">
                          {(metrics?.replyRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <Icon name="TrendingUp" size={24} color="var(--color-warning)" />
                    </div>
                  </div>
                  
                  <div className="glassmorphism rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Leads Generated</p>
                        <p className="text-2xl font-headline-bold text-foreground">
                          {leads.length}
                        </p>
                      </div>
                      <Icon name="Users" size={24} color="var(--color-accent)" />
                    </div>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Campaign Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-foreground">{formatDate(campaign.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subject:</span>
                        <span className="text-foreground">{campaign.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credits Used:</span>
                        <span className="text-foreground">{campaign.credits_used || 0}</span>
                      </div>
                      {campaign.fetching_started_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fetching Started:</span>
                          <span className="text-foreground">{formatDate(campaign.fetching_started_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Performance Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acceptance Rate:</span>
                        <span className="text-foreground">{(metrics?.acceptanceRate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Messages Opened:</span>
                        <span className="text-foreground">{metrics?.messagesOpened || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Meetings Booked:</span>
                        <span className="text-foreground">{campaign.meetings_booked || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'targeting' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Target Job Titles</h4>
                    <div className="space-y-2">
                      {campaign.target_job_titles?.length > 0 ? (
                        campaign.target_job_titles.map((title, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm mr-2 mb-2"
                          >
                            {title}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No job titles specified</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Target Industries</h4>
                    <div className="space-y-2">
                      {campaign.target_industries?.length > 0 ? (
                        campaign.target_industries.map((industry, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm mr-2 mb-2"
                          >
                            {industry}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No industries specified</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Target Locations</h4>
                    <div className="space-y-2">
                      {campaign.target_locations?.length > 0 ? (
                        campaign.target_locations.map((location, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm mr-2 mb-2"
                          >
                            {location}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No locations specified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'message' && (
              <div className="space-y-6">
                <div className="glassmorphism rounded-lg p-6">
                  <h4 className="text-lg font-headline-bold text-foreground mb-3">Message Template</h4>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-body">
                      {campaign.message_template || campaign.message}
                    </pre>
                  </div>
                </div>

                <div className="glassmorphism rounded-lg p-6">
                  <h4 className="text-lg font-headline-bold text-foreground mb-3">Processed Message Preview</h4>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-body">
                      {campaign.message}
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This shows how the message appears with personalization placeholders replaced.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-headline-bold text-foreground">Generated Leads ({leads.length})</h4>
                  <Button
                    onClick={() => navigate('/contacts')}
                    variant="outline"
                    size="sm"
                    iconName="ExternalLink"
                    iconPosition="right"
                  >
                    View All Contacts
                  </Button>
                </div>

                {leads.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="glassmorphism rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="User" size={20} color="var(--color-primary)" />
                          </div>
                          <div>
                            <div className="font-body-semibold text-foreground">{lead.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {lead.job_title} at {lead.company}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            lead.meeting_scheduled ? 'bg-success/20 text-success' :
                            lead.replied ? 'bg-primary/20 text-primary' :
                            lead.message_sent ? 'bg-warning/20 text-warning' : 'bg-muted/20 text-muted-foreground'
                          }`}>
                            {lead.meeting_scheduled ? 'Meeting Scheduled' :
                             lead.replied ? 'Replied' :
                             lead.message_sent ? 'Contacted' : 'New'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/contacts/${lead.id}`)}
                            iconName="Eye"
                          />
                        </div>
                      </div>
                    ))}
                    {leads.length > 5 && (
                      <div className="text-center">
                        <Button
                          onClick={() => navigate('/contacts')}
                          variant="outline"
                          size="sm"
                        >
                          View {leads.length - 5} More Leads
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="Users" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                    <p className="text-muted-foreground font-body-medium">
                      No leads generated yet. {campaign.status === 'active' ? 'Click "Start Fetching Leads" to begin.' : 'Start the campaign to generate leads.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CampaignPreviewPage;
