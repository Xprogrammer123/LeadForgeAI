import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import campaignService from '../../utils/campaignService';
import creditService from '../../utils/creditService';
import openaiService from '../../utils/openaiService';

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    message: '',
    message_template: '',
    target_job_titles: [],
    target_industries: [],
    target_locations: [],
    status: 'draft'
  });
  const { user } = useAuth();

  useEffect(() => {
    loadCampaigns();
    loadCreditBalance();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaigns();
      
      if (result?.success) {
        setCampaigns(result.data);
      } else {
        setError(result?.error || 'Failed to load campaigns');
      }
    } catch (err) {
      console.error('Error in loadCampaigns:', err);
      setError('An error occurred while loading campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadCreditBalance = async () => {
    if (user?.id) {
      try {
        const result = await creditService.getCreditBalance(user.id);
        if (result?.success) {
          setCreditBalance(result.data.credits);
        }
      } catch (err) {
        console.error('Error in loadCreditBalance:', err);
        setError('Failed to load credit balance');
      }
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    
    if (creditBalance < 20) {
      setError('Insufficient credits. You need at least 20 credits to create a campaign.');
      return;
    }

    try {
      // Debug user object to inspect metadata
      console.log('User object:', user);

      // Safely extract name with multiple fallbacks
      const firstName = user?.user_metadata?.name || 
                       user?.email?.split('@')?.[0] || 
                       (user?.id ? user.id.slice(0, 8) : 'Friend');
      const company = user?.user_metadata?.company || 'Your Company';
      const jobTitle = user?.user_metadata?.jobTitle || 'Professional';
      
      // Process message template with safe defaults
      let processedMessage = newCampaign.message_template || '';
      processedMessage = processedMessage.replace(/\{\{firstName\}\}/g, firstName);
      processedMessage = processedMessage.replace(/\{\{company\}\}/g, company);
      processedMessage = processedMessage.replace(/\{\{jobTitle\}\}/g, jobTitle);

      const campaignData = {
        ...newCampaign,
        message: processedMessage,
        user_id: user?.id || '',
        target_job_titles: newCampaign.target_job_titles.filter(t => t.trim()),
        target_industries: newCampaign.target_industries.filter(t => t.trim()),
        target_locations: newCampaign.target_locations.filter(t => t.trim())
      };
      
      if (!campaignData.user_id) {
        throw new Error('User ID is missing');
      }

      const result = await campaignService.createCampaign(campaignData);
      
      if (result?.success) {
        setCampaigns([result.data, ...campaigns]);
        setNewCampaign({ 
          name: '', 
          subject: '', 
          message: '', 
          message_template: '',
          target_job_titles: [],
          target_industries: [],
          target_locations: [],
          status: 'draft' 
        });
        setShowModal(false);
        setCreditBalance(prev => prev - 20);
        setError(''); // Clear any previous errors
      } else {
        if (result?.insufficientCredits) {
          setError(result.error + ' Please purchase more credits.');
        } else {
          setError(result?.error || 'Failed to create campaign');
        }
      }
    } catch (err) {
      console.error('Error in handleCreateCampaign:', err);
      setError('An error occurred while creating the campaign: ' + err.message);
    }
  };

  const handleGenerateTemplate = async () => {
    if (!newCampaign.name || newCampaign.target_job_titles.length === 0) {
      setError('Please provide a campaign name and at least one target job title');
      return;
    }

    try {
      setGeneratingTemplate(true);
      
      const result = await openaiService.generateCampaignTemplate(
        newCampaign.name,
        `${newCampaign.target_job_titles.join(', ')} in ${newCampaign.target_industries.join(', ') || 'various industries'}`,
        'AI-powered LinkedIn outreach platform'
      );

      if (result.success) {
        setNewCampaign(prev => ({
          ...prev,
          message_template: result.template,
          message: result.template
        }));
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to generate template: ' + result.error);
      }
    } catch (err) {
      console.error('Error in handleGenerateTemplate:', err);
      setError('An error occurred while generating the template');
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleSendMessages = async (campaignId) => {
    try {
      const result = await campaignService.sendCampaignMessages(campaignId);
      
      if (result.success) {
        loadCampaigns();
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to send messages: ' + result.error);
      }
    } catch (err) {
      console.error('Error in handleSendMessages:', err);
      setError('An error occurred while sending messages');
    }
  };

  const handleUpdateCampaignStatus = async (campaignId, newStatus) => {
    try {
      const result = await campaignService.updateCampaign(campaignId, { status: newStatus });
      
      if (result?.success) {
        setCampaigns(campaigns.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
        ));
        setError(''); // Clear any previous errors
      } else {
        setError(result?.error || 'Failed to update campaign status');
      }
    } catch (err) {
      console.error('Error in handleUpdateCampaignStatus:', err);
      setError('An error occurred while updating the campaign status');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const result = await campaignService.deleteCampaign(campaignId);
      
      if (result?.success) {
        setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
        setError(''); // Clear any previous errors
      } else {
        setError(result?.error || 'Failed to delete campaign');
      }
    } catch (err) {
      console.error('Error in handleDeleteCampaign:', err);
      setError('An error occurred while deleting the campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'paused': return 'bg-warning/20 text-warning border-warning/30';
      case 'draft': return 'bg-muted/20 text-muted-foreground border-muted/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const addTargetItem = (field, value) => {
    if (value.trim()) {
      setNewCampaign(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeTargetItem = (field, index) => {
    setNewCampaign(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  return (
    <DashboardLayout title="Campaigns" currentPath="/campaigns">
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
          <div>
            <h2 className="text-2xl font-headline-bold text-foreground">
              Campaign Management
            </h2>
            <p className="text-muted-foreground font-body">
              Create and manage your AI SDR campaigns • {creditBalance} credits available
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            variant="default"
            className="cta-button"
            iconName="Plus"
            iconPosition="left"
            disabled={creditBalance < 20}
          >
            New Campaign (20 credits)
          </Button>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Search" size={20} color="var(--color-muted-foreground)" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0"
            />
          </div>
        </motion.div>

        {/* Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-headline-bold text-foreground">
              Your Campaigns
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Campaign Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Leads
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Meetings
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Reply Rate
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-muted-foreground font-body-medium">Loading campaigns...</p>
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Icon name="Inbox" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-muted-foreground font-body-medium">
                        {creditBalance < 20 ? 'Purchase credits to create your first campaign' : 'No campaigns found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-body-semibold text-foreground">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {campaign.subject}
                          </div>
                          {campaign.target_job_titles?.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Targeting: {campaign.target_job_titles.slice(0, 2).join(', ')}
                              {campaign.target_job_titles.length > 2 && ` +${campaign.target_job_titles.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-body-medium rounded-full border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground font-body-medium">
                        {campaign.leads_generated || 0}
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground font-body-medium">
                        {campaign.meetings_booked || 0}
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground font-body-medium">
                        {(campaign.reply_rate || 0).toFixed(1)}%
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {campaign.status === 'active' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSendMessages(campaign.id)}
                            >
                              Send Messages
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateCampaignStatus(
                              campaign.id, 
                              campaign.status === 'active' ? 'paused' : 'active'
                            )}
                          >
                            {campaign.status === 'active' ? 'Pause' : 'Resume'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-error hover:text-error-foreground hover:bg-error/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glassmorphism rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-headline-bold text-foreground">
                Create New Campaign ({creditBalance} credits available)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                iconName="X"
              />
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body-semibold text-foreground mb-2">
                    Campaign Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    placeholder="Enter campaign name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-body-semibold text-foreground mb-2">
                    Subject Line *
                  </label>
                  <Input
                    type="text"
                    required
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                    placeholder="Enter subject line"
                  />
                </div>
              </div>

              {/* LinkedIn Targeting */}
              <div className="space-y-4">
                <h4 className="text-md font-headline-bold text-foreground">LinkedIn Targeting</h4>
                
                <div>
                  <label className="block text-sm font-body-semibold text-foreground mb-2">
                    Target Job Titles
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newCampaign.target_job_titles.map((title, index) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
                        {title}
                        <button
                          type="button"
                          onClick={() => removeTargetItem('target_job_titles', index)}
                          className="text-primary hover:text-primary-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter job title and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTargetItem('target_job_titles', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body-semibold text-foreground mb-2">
                    Target Industries
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newCampaign.target_industries.map((industry, index) => (
                      <span key={index} className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm flex items-center gap-2">
                        {industry}
                        <button
                          type="button"
                          onClick={() => removeTargetItem('target_industries', index)}
                          className="text-secondary hover:text-secondary-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter industry and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTargetItem('target_industries', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-body-semibold text-foreground mb-2">
                    Target Locations
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newCampaign.target_locations.map((location, index) => (
                      <span key={index} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-2">
                        {location}
                        <button
                          type="button"
                          onClick={() => removeTargetItem('target_locations', index)}
                          className="text-accent hover:text-accent-foreground"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter location and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTargetItem('target_locations', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-body-semibold text-foreground">
                    Message Template *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateTemplate}
                    disabled={generatingTemplate}
                    iconName="Wand2"
                    iconPosition="left"
                  >
                    {generatingTemplate ? 'Generating...' : 'AI Generate'}
                  </Button>
                </div>
                <textarea
                  required
                  rows={6}
                  value={newCampaign.message_template}
                  onChange={(e) => setNewCampaign({
                    ...newCampaign,
                    message_template: e.target.value,
                    message: e.target.value
                  })}
                  placeholder="Enter your LinkedIn message template. Use {{firstName}}, {{company}}, {{jobTitle}} for personalization."
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Use placeholders like firstName , company , jobTitle for AI personalization
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="cta-button"
                  disabled={creditBalance < 20}
                >
                  Create Campaign (20 credits)
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CampaignsPage;