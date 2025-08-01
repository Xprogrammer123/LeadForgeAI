
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { supabase } from '../../utils/supabase';
import googleCalendarService from '../../utils/googleCalendarService';

function ContactPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadContactData();
  }, [id]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      
      // Load lead details with campaign and meeting info
      const { data: leadData, error: leadError } = await supabase
        .from('linkedin_leads')
        .select(`
          *,
          campaigns(name, id, subject),
          meetings(
            id, 
            title, 
            scheduled_at, 
            duration_minutes, 
            meeting_link, 
            meeting_status,
            attendee_email,
            attendee_name
          )
        `)
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (leadError) {
        setError('Failed to load contact details');
        return;
      }

      setLead(leadData);
      setMeetings(leadData.meetings || []);

      // Load notes for this lead
      const { data: notesData, error: notesError } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!notesError) {
        setNotes(notesData || []);
      }

    } catch (err) {
      console.error('Error loading contact data:', err);
      setError('Failed to load contact data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: id,
          user_id: user.id,
          note: newNote.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        setError('Failed to add note');
        return;
      }

      setNotes([data, ...notes]);
      setNewNote('');
    } catch (err) {
      setError('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleScheduleMeeting = async () => {
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
        title: `LinkedIn Lead Meeting - ${lead.full_name}`,
        description: `Meeting with ${lead.full_name} (${lead.job_title} at ${lead.company}) from LinkedIn campaign`,
        startTime: timeSlot.start.toISOString(),
        duration: 30,
        attendeeEmail: lead.email,
        attendeeName: lead.full_name,
        timeZone: 'America/New_York'
      };

      const result = await googleCalendarService.createMeeting(meetingData);
      
      if (result.success) {
        // Save meeting to database
        const { error } = await supabase
          .from('meetings')
          .insert({
            user_id: user.id,
            lead_id: lead.id,
            campaign_id: lead.campaign_id,
            title: meetingData.title,
            description: meetingData.description,
            scheduled_at: meetingData.startTime,
            duration_minutes: meetingData.duration,
            meeting_link: result.data.meetingLink,
            google_calendar_event_id: result.data.eventId,
            attendee_email: lead.email,
            attendee_name: lead.full_name,
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
            .eq('id', lead.id);

          setShowScheduleModal(false);
          loadContactData(); // Refresh data
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (lead) => {
    if (lead.meeting_scheduled) return 'bg-success/20 text-success border-success/30';
    if (lead.replied) return 'bg-primary/20 text-primary border-primary/30';
    if (lead.message_sent) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-muted/20 text-muted-foreground border-muted/30';
  };

  const getStatusText = (lead) => {
    if (lead.meeting_scheduled) return 'Meeting Scheduled';
    if (lead.replied) return 'Replied';
    if (lead.message_sent) return 'Message Sent';
    return 'New Lead';
  };

  if (loading) {
    return (
      <DashboardLayout title="Contact Details" currentPath="/contacts">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Contact Details" currentPath="/contacts">
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} color="var(--color-error)" className="mx-auto mb-4" />
          <h2 className="text-xl font-headline-bold text-foreground mb-2">Contact Not Found</h2>
          <p className="text-muted-foreground mb-4">The contact you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/contacts')} variant="default">
            Back to Contacts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contact Details" currentPath="/contacts">
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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contacts')}
              iconName="ArrowLeft"
              iconPosition="left"
            >
              Back
            </Button>
            <div className="flex items-start space-x-4">
              {lead.profile_image_url ? (
                <img
                  src={lead.profile_image_url}
                  alt={lead.full_name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="User" size={32} color="var(--color-primary)" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-headline-bold text-foreground">{lead.full_name}</h2>
                <p className="text-lg text-muted-foreground font-body">{lead.job_title}</p>
                <p className="text-base text-muted-foreground">{lead.company}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 text-sm font-body-medium rounded-full border ${getStatusColor(lead)}`}>
                    {getStatusText(lead)}
                  </span>
                  {lead.reply_intent && (
                    <span className={`px-2 py-1 text-xs rounded ${
                      lead.reply_intent === 'interested' ? 'bg-success/20 text-success' :
                      lead.reply_intent === 'not_interested' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                    }`}>
                      {lead.reply_intent.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {lead.linkedin_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(lead.linkedin_url, '_blank')}
                iconName="ExternalLink"
                iconPosition="left"
              >
                LinkedIn Profile
              </Button>
            )}
            {!lead.meeting_scheduled && lead.replied && lead.reply_intent === 'interested' && (
              <Button
                onClick={handleScheduleMeeting}
                variant="default"
                className="cta-button"
                iconName="Calendar"
                iconPosition="left"
              >
                Schedule Meeting
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="glassmorphism rounded-xl overflow-hidden">
          <div className="flex border-b border-border">
            {[
              { id: 'overview', label: 'Overview', icon: 'User' },
              { id: 'communication', label: 'Communication', icon: 'MessageSquare' },
              { id: 'meetings', label: 'Meetings', icon: 'Calendar' },
              { id: 'notes', label: 'Notes', icon: 'FileText' }
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
                {tab.id === 'meetings' && meetings.length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    {meetings.length}
                  </span>
                )}
                {tab.id === 'notes' && notes.length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    {notes.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="text-foreground">{lead.email || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="text-foreground">{lead.location || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Industry:</span>
                        <span className="text-foreground">{lead.industry || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company Size:</span>
                        <span className="text-foreground">{lead.company_size || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Campaign Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campaign:</span>
                        <span className="text-foreground">
                          {lead.campaigns?.name || 'No campaign'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Found On:</span>
                        <span className="text-foreground">{formatDate(lead.created_at)}</span>
                      </div>
                      {lead.message_sent_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">First Contact:</span>
                          <span className="text-foreground">{formatDate(lead.message_sent_at)}</span>
                        </div>
                      )}
                      {lead.replied_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Reply:</span>
                          <span className="text-foreground">{formatDate(lead.replied_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {lead.bio && (
                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Bio</h4>
                    <p className="text-foreground">{lead.bio}</p>
                  </div>
                )}

                {lead.ai_analysis && (
                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">AI Analysis</h4>
                    <div className="space-y-2">
                      {lead.ai_analysis.confidence && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence Score:</span>
                          <span className="text-foreground">{(lead.ai_analysis.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {lead.ai_analysis.key_points && (
                        <div>
                          <span className="text-muted-foreground">Key Points:</span>
                          <ul className="mt-1 list-disc list-inside text-foreground">
                            {lead.ai_analysis.key_points.map((point, index) => (
                              <li key={index} className="text-sm">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'communication' && (
              <div className="space-y-6">
                {lead.reply_content && (
                  <div className="glassmorphism rounded-lg p-4">
                    <h4 className="text-lg font-headline-bold text-foreground mb-3">Latest Reply</h4>
                    <div className="bg-muted/20 rounded-lg p-4">
                      <p className="text-foreground whitespace-pre-wrap">{lead.reply_content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Received on {formatDate(lead.replied_at)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="glassmorphism rounded-lg p-4">
                  <h4 className="text-lg font-headline-bold text-foreground mb-3">Message History</h4>
                  <div className="space-y-3">
                    {lead.message_sent ? (
                      <div className="border-l-4 border-primary pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-body-semibold text-foreground">Initial Outreach Sent</p>
                            <p className="text-sm text-muted-foreground">
                              Campaign: {lead.campaigns?.subject || 'Unknown'}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {lead.message_sent_at ? formatDate(lead.message_sent_at) : 'Date unknown'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No messages sent yet</p>
                    )}

                    {lead.replied && (
                      <div className="border-l-4 border-success pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-body-semibold text-foreground">Reply Received</p>
                            <p className="text-sm text-muted-foreground">
                              Intent: {lead.reply_intent?.replace('_', ' ') || 'Unknown'}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(lead.replied_at)}
                          </span>
                        </div>
                      </div>
                    )}

                    {lead.meeting_scheduled && (
                      <div className="border-l-4 border-warning pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-body-semibold text-foreground">Meeting Scheduled</p>
                            <p className="text-sm text-muted-foreground">
                              Follow-up meeting arranged
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {lead.meeting_scheduled_at ? formatDate(lead.meeting_scheduled_at) : 'Date unknown'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-headline-bold text-foreground">Meetings ({meetings.length})</h4>
                  {!lead.meeting_scheduled && lead.replied && lead.reply_intent === 'interested' && (
                    <Button
                      onClick={handleScheduleMeeting}
                      variant="default"
                      size="sm"
                      iconName="Plus"
                      iconPosition="left"
                    >
                      Schedule Meeting
                    </Button>
                  )}
                </div>

                {meetings.length > 0 ? (
                  <div className="space-y-4">
                    {meetings.map((meeting) => (
                      <div key={meeting.id} className="glassmorphism rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-body-semibold text-foreground">{meeting.title}</h5>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(meeting.scheduled_at)} • {meeting.duration_minutes} minutes
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                meeting.meeting_status === 'scheduled' ? 'bg-success/20 text-success' :
                                meeting.meeting_status === 'completed' ? 'bg-primary/20 text-primary' :
                                'bg-muted/20 text-muted-foreground'
                              }`}>
                                {meeting.meeting_status}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {meeting.meeting_link && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(meeting.meeting_link, '_blank')}
                                iconName="Video"
                                iconPosition="left"
                              >
                                Join Meeting
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="Calendar" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                    <p className="text-muted-foreground font-body-medium">
                      No meetings scheduled with this contact yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6">
                <form onSubmit={handleAddNote} className="glassmorphism rounded-lg p-4">
                  <h4 className="text-lg font-headline-bold text-foreground mb-3">Add Note</h4>
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this contact..."
                      rows={3}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!newNote.trim() || addingNote}
                        variant="default"
                        size="sm"
                        iconName="Plus"
                        iconPosition="left"
                      >
                        {addingNote ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="space-y-4">
                  <h4 className="text-lg font-headline-bold text-foreground">Notes History ({notes.length})</h4>
                  {notes.length > 0 ? (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="glassmorphism rounded-lg p-4">
                          <p className="text-foreground whitespace-pre-wrap">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(note.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon name="FileText" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-muted-foreground font-body-medium">
                        No notes yet. Add your first note above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
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
                Schedule Meeting with {lead.full_name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScheduleModal(false)}
                iconName="X"
              />
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
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ContactPreviewPage;
