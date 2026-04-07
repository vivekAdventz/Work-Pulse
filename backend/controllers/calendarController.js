import axios from 'axios';
import CalendarEvent from '../models/CalendarEvent.js';
import TimeEntry from '../models/TimeEntry.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import User from '../models/User.js';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Extract the Microsoft Graph access token from the request.
 * The frontend sends it in the 'x-ms-token' header to keep it separate
 * from the app's own JWT in the Authorization header.
 */
function getMsToken(req) {
  const msToken = req.headers['x-ms-token'];
  if (!msToken) return null;
  return msToken;
}

/**
 * Build the Graph API event body from time entry data.
 * Maps: projectName > subProject (activity type) → subject
 *       team members → attendees
 *       description → event body
 *       date + start/end time → event start/end
 */
async function buildEventPayload(timeEntryData, attendeeEmails = []) {
  // Look up project and sub-project names
  let subject = 'Work Session';
  
  if (timeEntryData.projectId) {
    const project = await Project.findById(timeEntryData.projectId);
    if (project) {
      subject = project.name;
      if (timeEntryData.subProjectId) {
        const subProject = await SubProject.findById(timeEntryData.subProjectId);
        if (subProject) {
          subject = `${project.name} > ${subProject.name}`;
        }
      }
    }
  }

  // Build ISO datetime strings from date and time fields
  // TimeEntry stores date as "YYYY-MM-DD" and time as "HH:mm:ss"
  const startDateTime = `${timeEntryData.date}T${timeEntryData.startTime}`;
  const endDateTime = `${timeEntryData.date}T${timeEntryData.endTime}`;

  // Build attendee list from team member emails
  const attendees = attendeeEmails.map(email => ({
    emailAddress: { address: email, name: email },
    type: 'required',
  }));

  const eventPayload = {
    subject,
    body: {
      contentType: 'HTML',
      content: timeEntryData.description
        ? `<p>${timeEntryData.description.replace(/\n/g, '<br/>')}</p>`
        : '<p>Time entry from WorkPulse</p>',
    },
    start: {
      dateTime: startDateTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Asia/Kolkata',
    },
    // Enable Teams meeting
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
    attendees,
  };

  return { eventPayload, subject, startDateTime, endDateTime, attendeeEmails };
}

/**
 * POST /api/calendar/events
 * Create a calendar event in Microsoft Teams via Graph API.
 * 
 * Request body:
 *   - timeEntryId: ID of the time entry to link
 *   
 * Headers:
 *   - x-ms-token: Microsoft Graph access token (from frontend MSAL)
 *   - Authorization: Bearer <JWT> (app auth, handled by middleware)
 */
export const createCalendarEvent = async (req, res) => {
  const msToken = getMsToken(req);
  if (!msToken) {
    return res.status(401).json({ 
      error: 'Microsoft access token is required. Please sign in with Microsoft.' 
    });
  }

  const { timeEntryId } = req.body;
  if (!timeEntryId) {
    return res.status(400).json({ error: 'timeEntryId is required' });
  }

  // Fetch the time entry
  const timeEntry = await TimeEntry.findById(timeEntryId);
  if (!timeEntry) {
    return res.status(404).json({ error: 'Time entry not found' });
  }

  // Resolve team member emails (only for "real" users who have email in our DB)
  const attendeeEmails = [];
  if (timeEntry.teamMemberIds && timeEntry.teamMemberIds.length > 0) {
    const teamUsers = await User.find({ 
      _id: { $in: timeEntry.teamMemberIds } 
    });
    for (const u of teamUsers) {
      if (u.email) attendeeEmails.push(u.email);
    }
  }

  // Build the event payload
  const { eventPayload, subject, startDateTime, endDateTime } = 
    await buildEventPayload(timeEntry, attendeeEmails);

  try {
    // Call Microsoft Graph API to create the event
    const graphResponse = await axios.post(
      `${GRAPH_API_BASE}/me/events`,
      eventPayload,
      {
        headers: {
          Authorization: `Bearer ${msToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const graphEvent = graphResponse.data;

    // Extract Teams meeting join URL
    const joinUrl = graphEvent.onlineMeeting?.joinUrl || '';

    // Cache/log the calendar event in MongoDB
    const calendarEvent = await CalendarEvent.create({
      timeEntryId,
      userId: req.user.userId,
      graphEventId: graphEvent.id,
      subject,
      startDateTime,
      endDateTime,
      joinUrl,
      attendees: attendeeEmails,
      isOnlineMeeting: true,
    });

    res.status(201).json({
      success: true,
      calendarEvent: {
        id: calendarEvent._id,
        graphEventId: graphEvent.id,
        subject,
        startDateTime,
        endDateTime,
        joinUrl,
        attendees: attendeeEmails,
        isOnlineMeeting: true,
        webLink: graphEvent.webLink || '',
      },
    });
  } catch (error) {
    console.error('Graph API error:', error.response?.data || error.message);
    
    // Handle specific Graph API errors
    if (error.response) {
      const status = error.response.status;
      const graphError = error.response.data?.error;
      
      if (status === 401) {
        return res.status(401).json({ 
          error: 'Microsoft token expired or invalid. Please re-authenticate.' 
        });
      }
      if (status === 403) {
        return res.status(403).json({ 
          error: 'Insufficient permissions. Please grant Calendars.ReadWrite permission.' 
        });
      }
      return res.status(status).json({ 
        error: graphError?.message || 'Failed to create calendar event' 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create calendar event' });
  }
};

/**
 * GET /api/calendar/events
 * List calendar events from Microsoft Graph API (user's calendar).
 */
export const getCalendarEvents = async (req, res) => {
  const msToken = getMsToken(req);
  if (!msToken) {
    return res.status(401).json({ 
      error: 'Microsoft access token is required.' 
    });
  }

  try {
    const graphResponse = await axios.get(
      `${GRAPH_API_BASE}/me/events?$top=50&$orderby=start/dateTime desc&$select=id,subject,start,end,bodyPreview,isOnlineMeeting,onlineMeeting,webLink,attendees`,
      {
        headers: {
          Authorization: `Bearer ${msToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const events = graphResponse.data.value.map(ev => ({
      id: ev.id,
      subject: ev.subject,
      startDateTime: ev.start?.dateTime,
      endDateTime: ev.end?.dateTime,
      timeZone: ev.start?.timeZone,
      bodyPreview: ev.bodyPreview,
      isOnlineMeeting: ev.isOnlineMeeting,
      joinUrl: ev.onlineMeeting?.joinUrl || '',
      webLink: ev.webLink || '',
      attendees: (ev.attendees || []).map(a => ({
        email: a.emailAddress?.address,
        name: a.emailAddress?.name,
        status: a.status?.response,
      })),
    }));

    res.json({ events });
  } catch (error) {
    console.error('Graph API error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Microsoft token expired.' });
    }
    return res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

/**
 * GET /api/calendar/events/linked/:timeEntryId
 * Get the calendar event linked to a specific time entry (from our cache).
 */
export const getLinkedCalendarEvent = async (req, res) => {
  const { timeEntryId } = req.params;
  const calendarEvent = await CalendarEvent.findOne({ timeEntryId });
  
  if (!calendarEvent) {
    return res.status(404).json({ error: 'No calendar event linked to this time entry' });
  }

  res.json({ calendarEvent });
};

/**
 * DELETE /api/calendar/events/:graphEventId
 * Delete a calendar event from Microsoft Graph API and our cache.
 */
export const deleteCalendarEvent = async (req, res) => {
  const msToken = getMsToken(req);
  if (!msToken) {
    return res.status(401).json({ error: 'Microsoft access token is required.' });
  }
  
  const { graphEventId } = req.params;

  try {
    // Delete from Graph API
    await axios.delete(`${GRAPH_API_BASE}/me/events/${graphEventId}`, {
      headers: { Authorization: `Bearer ${msToken}` },
    });

    // Remove from our cache
    await CalendarEvent.deleteOne({ graphEventId });

    res.json({ success: true, message: 'Calendar event deleted' });
  } catch (error) {
    console.error('Graph API delete error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      // Already deleted from Graph, clean up our cache
      await CalendarEvent.deleteOne({ graphEventId });
      return res.json({ success: true, message: 'Calendar event already deleted' });
    }
    return res.status(500).json({ error: 'Failed to delete calendar event' });
  }
};
