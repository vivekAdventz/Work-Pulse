import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  // Link to the time entry that created this event
  timeEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry', required: true },
  // The user who created the event
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Microsoft Graph event ID (for future updates/deletes)
  graphEventId: { type: String, required: true },
  // Event subject/title
  subject: { type: String, required: true },
  // Start and end times (ISO 8601)
  startDateTime: { type: String, required: true },
  endDateTime: { type: String, required: true },
  // Teams meeting join URL (if online meeting was created)
  joinUrl: { type: String, default: '' },
  // Attendee emails
  attendees: [{ type: String }],
  // Whether this is a Teams meeting
  isOnlineMeeting: { type: Boolean, default: false },
  // Created timestamp
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CalendarEvent', calendarEventSchema);
