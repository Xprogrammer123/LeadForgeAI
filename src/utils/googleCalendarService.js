/**
         * Google Calendar service for meeting scheduling
         */

        const googleCalendarService = {
          /**
           * Initialize Google Calendar API
           */
          initializeGoogleAuth: async () => {
            try {
              if (typeof window.gapi === 'undefined') {
                await new Promise((resolve) => {
                  window.gapi = window.gapi || {};
                  window.gapi.load = function(api, callback) {
                    const script = document.createElement('script');
                    script.src = 'https://apis.google.com/js/api.js';
                    script.onload = callback;
                    document.head.appendChild(script);
                  };
                  window.gapi.load('auth2:client', resolve);
                });
              }

              await window.gapi.client.init({
                clientId: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar'
              });

              return { success: true };
            } catch (error) {
              console.error('Error initializing Google Calendar:', error);
              return { success: false, error: 'Failed to initialize Google Calendar' };
            }
          },

          /**
           * Authenticate user with Google
           */
          authenticateUser: async () => {
            try {
              const authInstance = window.gapi.auth2.getAuthInstance();
              const user = await authInstance.signIn();
              
              return {
                success: true,
                data: {
                  accessToken: user.getAuthResponse().access_token,
                  profile: user.getBasicProfile()
                }
              };
            } catch (error) {
              console.error('Error authenticating with Google:', error);
              return { success: false, error: 'Failed to authenticate with Google' };
            }
          },

          /**
           * Get user's available time slots
           */
          getAvailableTimeSlots: async (startDate, endDate, timeZone = 'America/New_York') => {
            try {
              const calendar = window.gapi.client.calendar;
              
              // Get busy times
              const freeBusyResponse = await calendar.freebusy.query({
                resource: {
                  timeMin: startDate.toISOString(),
                  timeMax: endDate.toISOString(),
                  timeZone: timeZone,
                  items: [{ id: 'primary' }]
                }
              });

              const busyTimes = freeBusyResponse.result.calendars.primary.busy || [];
              
              // Generate available slots (9 AM - 5 PM, 30-minute slots)
              const availableSlots = [];
              const current = new Date(startDate);
              
              while (current < endDate) {
                // Skip weekends
                if (current.getDay() === 0 || current.getDay() === 6) {
                  current.setDate(current.getDate() + 1);
                  current.setHours(9, 0, 0, 0);
                  continue;
                }
                
                // Set working hours (9 AM - 5 PM)
                if (current.getHours() < 9) {
                  current.setHours(9, 0, 0, 0);
                } else if (current.getHours() >= 17) {
                  current.setDate(current.getDate() + 1);
                  current.setHours(9, 0, 0, 0);
                  continue;
                }
                
                const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes later
                
                // Check if slot conflicts with busy times
                const isConflict = busyTimes.some(busy => {
                  const busyStart = new Date(busy.start);
                  const busyEnd = new Date(busy.end);
                  return current < busyEnd && slotEnd > busyStart;
                });
                
                if (!isConflict) {
                  availableSlots.push({
                    start: new Date(current),
                    end: new Date(slotEnd),
                    formatted: current.toLocaleString()
                  });
                }
                
                current.setTime(current.getTime() + 30 * 60000); // Move to next 30-minute slot
              }
              
              return {
                success: true,
                data: { availableSlots: availableSlots.slice(0, 20) } // Limit to 20 slots
              };
            } catch (error) {
              console.error('Error getting available time slots:', error);
              return { success: false, error: 'Failed to get available time slots' };
            }
          },

          /**
           * Create calendar event for meeting
           */
          createMeeting: async (meetingData) => {
            try {
              const calendar = window.gapi.client.calendar;
              
              const event = {
                summary: meetingData.title || 'LinkedIn Lead Meeting',
                description: meetingData.description || `Meeting with ${meetingData.attendeeName} from LinkedIn campaign`,
                start: {
                  dateTime: meetingData.startTime,
                  timeZone: meetingData.timeZone || 'America/New_York'
                },
                end: {
                  dateTime: new Date(new Date(meetingData.startTime).getTime() + (meetingData.duration || 30) * 60000).toISOString(),
                  timeZone: meetingData.timeZone || 'America/New_York'
                },
                attendees: [
                  { email: meetingData.attendeeEmail }
                ],
                conferenceData: {
                  createRequest: {
                    requestId: `linkedin-${Date.now()}`,
                    conferenceSolutionKey: { type: 'adaptiveHangoutsMeet' }
                  }
                },
                reminders: {
                  useDefault: false,
                  overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 15 }       // 15 minutes before
                  ]
                }
              };

              const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all'
              });

              return {
                success: true,
                data: {
                  eventId: response.result.id,
                  meetingLink: response.result.conferenceData?.conferenceId 
                    ? `https://meet.google.com/${response.result.conferenceData.conferenceId}`
                    : response.result.htmlLink,
                  event: response.result
                }
              };
            } catch (error) {
              console.error('Error creating meeting:', error);
              return { success: false, error: 'Failed to create meeting' };
            }
          },

          /**
           * Update existing meeting
           */
          updateMeeting: async (eventId, updates) => {
            try {
              const calendar = window.gapi.client.calendar;
              
              const response = await calendar.events.patch({
                calendarId: 'primary',
                eventId: eventId,
                resource: updates,
                sendUpdates: 'all'
              });

              return {
                success: true,
                data: { event: response.result }
              };
            } catch (error) {
              console.error('Error updating meeting:', error);
              return { success: false, error: 'Failed to update meeting' };
            }
          },

          /**
           * Cancel meeting
           */
          cancelMeeting: async (eventId) => {
            try {
              const calendar = window.gapi.client.calendar;
              
              await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
                sendUpdates: 'all'
              });

              return { success: true };
            } catch (error) {
              console.error('Error cancelling meeting:', error);
              return { success: false, error: 'Failed to cancel meeting' };
            }
          },

          /**
           * Generate scheduling link for prospects
           */
          generateSchedulingLink: (userId, campaignId, leadId) => {
            const baseUrl = window.location.origin;
            return `${baseUrl}/schedule/${userId}/${campaignId}/${leadId}`;
          }
        };

        export default googleCalendarService;