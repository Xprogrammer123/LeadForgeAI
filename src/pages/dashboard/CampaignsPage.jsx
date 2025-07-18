import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import campaignService from '../../utils/campaignService';

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    message: '',
    status: 'draft'
  });
  const { user } = useAuth();

  useEffect(() => {
    loadCampaigns();
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
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const campaignData = {
        ...newCampaign,
        user_id: user.id
      };
      
      const result = await campaignService.createCampaign(campaignData);
      
      if (result?.success) {
        setCampaigns([result.data, ...campaigns]);
        setNewCampaign({ name: '', subject: '', message: '', status: 'draft' });
        setShowModal(false);
      } else {
        setError(result?.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
    }
  };

  const handleUpdateCampaignStatus = async (campaignId, newStatus) => {
    try {
      const result = await campaignService.updateCampaign(campaignId, { status: newStatus });
      
      if (result?.success) {
        setCampaigns(campaigns.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
        ));
      } else {
        setError(result?.error || 'Failed to update campaign');
      }
    } catch (err) {
      setError('Failed to update campaign');
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
      } else {
        setError(result?.error || 'Failed to delete campaign');
      }
    } catch (err) {
      setError('Failed to delete campaign');
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
              Create and manage your AI SDR campaigns
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            variant="default"
            className="cta-button"
            iconName="Plus"
            iconPosition="left"
          >
            New Campaign
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
                      <p className="text-muted-foreground font-body-medium">No campaigns found</p>
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
                        {campaign.reply_rate || 0}%
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
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
            className="glassmorphism rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-headline-bold text-foreground">
                Create New Campaign
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                iconName="X"
              />
            </div>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Campaign Name
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
                  Subject
                </label>
                <Input
                  type="text"
                  required
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                  placeholder="Enter campaign message"
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={newCampaign.status}
                  onChange={(e) => setNewCampaign({...newCampaign, status: e.target.value})}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
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
                >
                  Create Campaign
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