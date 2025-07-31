import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/AppIcon';
import { supabase } from '../../utils/supabase';
import googleCalendarService from '../../utils/googleCalendarService';

function ContactsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('linkedin_leads')
        .select(`
          *,
          campaigns(name, id),
          meetings(id, scheduled_at, meeting_status)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load leads: ' + error.message);
        return;
      }

      setLeads(data || []);
    } catch (err) {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async (lead) => {
    setSelectedLead(lead);
    
    try {
      // Initialize Google Calendar
      const initResult = await googleCalendarService.initializeGoogleAuth();
      if (!initResult.success) {
        setError('Failed to initialize Google Calendar');
        return;
      }

      // Authenticate user
      const authResult = await googleCalendarService.authenticateUser();
      if (!authResult.success) {
        setError('Failed to authenticate with Google Calendar');
        return;
      }

      // Get available slots for next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const slotsResult = await googleCalendarService.getAvailableTimeSlots(startDate, endDate);
      if (slotsResult.success) {
        setAvailableSlots(slotsResult.data.availableSlots);
        setShowScheduleModal(true);
      } else {
        setError('Failed to get available time slots');
      }
    } catch (err) {
      setError('Failed to initialize meeting scheduling');
    }
  };

  const confirmMeeting = async (timeSlot) => {
    try {
      const meetingData = {
        title: `LinkedIn Lead Meeting - ${selectedLead.full_name}`,
        description: `Meeting with ${selectedLead.full_name} (${selectedLead.job_title} at ${selectedLead.company}) from LinkedIn campaign`,
        startTime: timeSlot.start.toISOString(),
        duration: 30,
        attendeeEmail: selectedLead.email,
        attendeeName: selectedLead.full_name,
        timeZone: 'America/New_York'
      };

      const result = await googleCalendarService.createMeeting(meetingData);
      
      if (result.success) {
        // Save meeting to database
        const { error } = await supabase
          .from('meetings')
          .insert({
            user_id: user.id,
            lead_id: selectedLead.id,
            campaign_id: selectedLead.campaign_id,
            title: meetingData.title,
            description: meetingData.description,
            scheduled_at: meetingData.startTime,
            duration_minutes: meetingData.duration,
            meeting_link: result.data.meetingLink,
            google_calendar_event_id: result.data.eventId,
            attendee_email: selectedLead.email,
            attendee_name: selectedLead.full_name,
            meeting_status: 'scheduled'
          });

        if (!error) {
          // Update lead status
          await supabase
            .from('linkedin_leads')
            .update({
              meeting_scheduled: true,
              meeting_scheduled_at: new Date().toISOString()
            })
            .eq('id', selectedLead.id);

          setShowScheduleModal(false);
          setSelectedLead(null);
          loadLeads(); // Refresh leads
        } else {
          setError('Failed to save meeting to database');
        }
      } else {
        setError('Failed to create meeting: ' + result.error);
      }
    } catch (err) {
      setError('Failed to confirm meeting');
    }
  };

  const getLeadStatusColor = (lead) => {
    if (lead.meeting_scheduled) return 'bg-success/20 text-success border-success/30';
    if (lead.replied) return 'bg-primary/20 text-primary border-primary/30';
    if (lead.message_sent) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-muted/20 text-muted-foreground border-muted/30';
  };

  const getLeadStatusText = (lead) => {
    if (lead.meeting_scheduled) return 'Meeting Scheduled';
    if (lead.replied) return 'Replied';
    if (lead.message_sent) return 'Message Sent';
    return 'New Lead';
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'new') return matchesSearch && !lead.message_sent;
    if (statusFilter === 'contacted') return matchesSearch && lead.message_sent && !lead.replied;
    if (statusFilter === 'replied') return matchesSearch && lead.replied;
    if (statusFilter === 'scheduled') return matchesSearch && lead.meeting_scheduled;
    
    return matchesSearch;
  });

  return (
    <DashboardLayout title="Leads & Contacts" currentPath="/contacts">
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
              LinkedIn Leads & Contacts
            </h2>
            <p className="text-muted-foreground font-body">
              Manage your leads generated from campaigns
            </p>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Icon name="Search" size={20} color="var(--color-muted-foreground)" />
                <Input
                  type="text"
                  placeholder="Search leads by name, company, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[150px]"
              >
                <option value="all">All Leads</option>
                <option value="new">New Leads</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="scheduled">Meeting Scheduled</option>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-headline-bold text-foreground">
              Your Leads ({filteredLeads.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Lead Details
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Company & Role
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Campaign
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Reply Intent
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
                      <p className="text-muted-foreground font-body-medium">Loading leads...</p>
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Icon name="Users" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-muted-foreground font-body-medium">
                        No leads found. Create a campaign to start generating leads.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          {lead.profile_image_url ? (
                            <img
                              src={lead.profile_image_url}
                              alt={lead.full_name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon name="User" size={20} color="var(--color-primary)" />
                            </div>
                          )}
                          <div>
                            <div className="font-body-semibold text-foreground">
                              {lead.full_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {lead.location}
                            </div>
                            {lead.linkedin_url && (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View LinkedIn
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-body-semibold text-foreground">
                            {lead.company}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {lead.job_title}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-foreground">
                          {lead.campaigns?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 text-xs font-body-medium rounded-full border ${getLeadStatusColor(lead)}`}>
                          {getLeadStatusText(lead)}
                        </span>
                        {lead.replied_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Replied: {new Date(lead.replied_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {lead.reply_intent && (
                          <div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              lead.reply_intent === 'interested' ? 'bg-success/20 text-success' :
                              lead.reply_intent === 'not_interested'? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                            }`}>
                              {lead.reply_intent.replace('_', ' ')}
                            </span>
                            {lead.ai_analysis?.confidence && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Confidence: {(lead.ai_analysis.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {lead.replied && lead.reply_intent === 'interested' && !lead.meeting_scheduled && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleScheduleMeeting(lead)}
                              iconName="Calendar"
                              iconPosition="left"
                              className="cta-button"
                            >
                              Schedule
                            </Button>
                          )}
                          {lead.meetings?.length > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(lead.meetings[0].meeting_link, '_blank')}
                              iconName="ExternalLink"
                              iconPosition="left"
                            >
                              Join Meeting
                            </Button>
                          )}
                          {lead.reply_content && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => alert(lead.reply_content)} // TODO: Replace with proper modal
                              iconName="MessageSquare"
                              iconPosition="left"
                            >
                              View Reply
                            </Button>
                          )}
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

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glassmorphism rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-headline-bold text-foreground">
                Schedule Meeting with {selectedLead?.full_name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedLead(null);
                }}
                iconName="X"
              />
            </div>
            
            <div className="space-y-4">
              <div className="glassmorphism rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="User" size={24} color="var(--color-primary)" />
                  </div>
                  <div>
                    <div className="font-body-semibold text-foreground">
                      {selectedLead?.full_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedLead?.job_title} at {selectedLead?.company}
                    </div>
                  </div>
                </div>
                {selectedLead?.reply_content && (
                  <div className="mt-3 p-3 bg-muted/20 rounded-lg">
                    <div className="text-sm font-body-semibold text-foreground mb-1">Their Reply:</div>
                    <div className="text-sm text-muted-foreground">
                      "{selectedLead.reply_content}"
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-md font-headline-bold text-foreground mb-4">
                  Available Time Slots
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start p-4 h-auto"
                      onClick={() => confirmMeeting(slot)}
                    >
                      <div className="text-left">
                        <div className="font-body-semibold">
                          {slot.start.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ContactsPage;