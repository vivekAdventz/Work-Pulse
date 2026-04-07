import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createCalendarEvent,
  getCalendarEvents,
  getLinkedCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendarController.js';

const router = Router();

// Create a calendar event linked to a time entry
router.post('/', asyncHandler(createCalendarEvent));

// List calendar events from Graph API
router.get('/', asyncHandler(getCalendarEvents));

// Get calendar event linked to a specific time entry (from cache)
router.get('/linked/:timeEntryId', asyncHandler(getLinkedCalendarEvent));

// Delete a calendar event
router.delete('/:graphEventId', asyncHandler(deleteCalendarEvent));

export default router;
