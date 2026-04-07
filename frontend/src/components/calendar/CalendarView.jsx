import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api';

// ─── Helpers ─────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function formatTime(isoOrTime) {
  if (!isoOrTime) return '';
  try {
    // Handle ISO strings like "2026-04-06T09:00:00.0000000"
    if (isoOrTime.includes('T')) {
      const parts = isoOrTime.split('T')[1];
      return parts.substring(0, 5);
    }
    // Handle plain time strings like "09:00:00"
    return isoOrTime.substring(0, 5);
  } catch {
    return isoOrTime;
  }
}

// Assign a deterministic color index based on a string (subject/project name)
const EVENT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', accent: 'from-blue-500 to-blue-600' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500', accent: 'from-violet-500 to-violet-600' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', accent: 'from-emerald-500 to-emerald-600' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', accent: 'from-amber-500 to-amber-600' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', accent: 'from-rose-500 to-rose-600' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500', accent: 'from-cyan-500 to-cyan-600' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500', accent: 'from-indigo-500 to-indigo-600' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500', accent: 'from-pink-500 to-pink-600' },
];

function colorForSubject(str) {
  if (!str) return EVENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

// ─── Spinner ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>
    </div>
  );
}

// ─── Event Detail Modal ──────────────────────────────────────────────────
function EventDetailModal({ event, onClose }) {
  if (!event) return null;
  const color = colorForSubject(event.subject);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        {/* Header gradient bar */}
        <div className={`h-2 bg-gradient-to-r ${color.accent}`} />
        
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-800 leading-snug">{event.subject || 'Untitled Event'}</h3>
              {event.isOnlineMeeting && (
                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Teams Meeting
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg shrink-0">
              ×
            </button>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {formatTime(event.startDateTime)} — {formatTime(event.endDateTime)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {event.startDateTime?.split('T')[0]}
                {event.timeZone && ` · ${event.timeZone}`}
              </p>
            </div>
          </div>

          {/* Description */}
          {event.bodyPreview && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{event.bodyPreview}</p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Attendees ({event.attendees.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                      {(a.name || a.email || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-slate-700 font-medium truncate max-w-[150px]">{a.name || a.email}</span>
                    {a.status && a.status !== 'none' && (
                      <span className={`text-[9px] font-semibold uppercase ${
                        a.status === 'accepted' ? 'text-emerald-500' :
                        a.status === 'declined' ? 'text-red-500' :
                        a.status === 'tentativelyAccepted' ? 'text-amber-500' :
                        'text-slate-400'
                      }`}>
                        {a.status === 'tentativelyAccepted' ? 'tentative' : a.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {event.joinUrl && (
              <a
                href={event.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-indigo-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Meeting
              </a>
            )}
            {event.webLink && (
              <a
                href={event.webLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Outlook
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main CalendarView Component ─────────────────────────────────────────
export default function CalendarView({ user, showToast }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const today = useMemo(() => dateKey(new Date()), []);

  // Fetch events from Microsoft Graph
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await api.getCalendarEvents();
      setEvents(result.events || []);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
      setError(err.message || 'Failed to load calendar events');
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Build events map by date key
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!ev.startDateTime) continue;
      // Parse the start date — Graph returns ISO like "2026-04-06T09:00:00.0000000"
      const dt = ev.startDateTime.split('T')[0];
      if (!map[dt]) map[dt] = [];
      map[dt].push(ev);
    }
    // Sort events within each day by start time
    for (const dt of Object.keys(map)) {
      map[dt].sort((a, b) => (a.startDateTime || '').localeCompare(b.startDateTime || ''));
    }
    return map;
  }, [events]);

  // Calendar grid computation
  const { year, month, calendarDays } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const days = [];

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(y, m - 1, daysInPrevMonth - i);
      days.push({ date: d, key: dateKey(d), inMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m, i);
      days.push({ date: d, key: dateKey(d), inMonth: true });
    }

    // Next month's leading days to fill the grid
    const remaining = 42 - days.length; // 6 weeks × 7 days
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m + 1, i);
      days.push({ date: d, key: dateKey(d), inMonth: false });
    }

    return { year: y, month: m, calendarDays: days };
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, key: dateKey(d), inMonth: true });
    }
    return days;
  }, [currentDate, viewMode]);

  const navPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const navNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const handleDayClick = (dayKey, dayEvents) => {
    if (dayEvents && dayEvents.length > 0) {
      setSelectedDayKey(dayKey);
      setSelectedDayEvents(dayEvents);
    }
  };

  // Total event count for the current month
  const monthEventCount = useMemo(() => {
    let count = 0;
    for (const day of calendarDays) {
      if (day.inMonth && eventsByDate[day.key]) count += eventsByDate[day.key].length;
    }
    return count;
  }, [calendarDays, eventsByDate]);

  // Upcoming events (next 5 from today)
  const upcomingEvents = useMemo(() => {
    const todayStr = dateKey(new Date());
    return events
      .filter(ev => (ev.startDateTime?.split('T')[0] || '') >= todayStr)
      .sort((a, b) => (a.startDateTime || '').localeCompare(b.startDateTime || ''))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Teams Calendar
              </h2>
              <p className="text-sm text-slate-400 mt-1 ml-[52px]">Your Microsoft Teams calendar events at a glance.</p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl shadow-inner">
                <button
                  onClick={() => setViewMode('month')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  </svg>
                  Month
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                    viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Week
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchEvents}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <button
              onClick={navPrev}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-slate-800 min-w-[180px] text-center">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button
              onClick={navNext}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToday}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors uppercase tracking-wide"
            >
              Today
            </button>
            <span className="text-xs text-slate-400 hidden sm:block">
              {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} this month
            </span>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-4 md:p-6">
          {isLoading && events.length === 0 ? (
            <Spinner />
          ) : error && events.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Failed to load calendar</h3>
              <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">{error}</p>
              <button onClick={fetchEvents} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center py-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                      d === 'Sun' || d === 'Sat' ? 'text-rose-400' : 'text-slate-400'
                    }`}>{d}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className={`grid grid-cols-7 gap-1 ${viewMode === 'week' ? '' : ''}`}>
                {(viewMode === 'week' ? weekDays : calendarDays).map((day, idx) => {
                  const dayEvents = eventsByDate[day.key] || [];
                  const isToday = day.key === today;
                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                  const maxVisible = viewMode === 'week' ? 6 : 3;
                  const moreCount = dayEvents.length > maxVisible ? dayEvents.length - maxVisible : 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(day.key, dayEvents)}
                      className={`
                        relative rounded-xl p-2 transition-all cursor-pointer
                        ${viewMode === 'week' ? 'min-h-[200px]' : 'min-h-[100px] md:min-h-[120px]'}
                        ${day.inMonth ? 'bg-white' : 'bg-slate-50/50'}
                        ${isToday ? 'ring-2 ring-indigo-400 ring-offset-1 shadow-md shadow-indigo-100' : 'border border-slate-100'}
                        ${dayEvents.length > 0 && day.inMonth ? 'hover:shadow-md hover:-translate-y-0.5' : 'hover:bg-slate-50'}
                      `}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`
                          text-sm font-semibold leading-none
                          ${isToday ? 'w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200' : ''}
                          ${!isToday && day.inMonth ? (isWeekend ? 'text-rose-400' : 'text-slate-700') : ''}
                          ${!day.inMonth ? 'text-slate-300' : ''}
                        `}>
                          {day.date.getDate()}
                        </span>
                        {dayEvents.length > 0 && !isToday && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Events */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, maxVisible).map((ev, i) => {
                          const c = colorForSubject(ev.subject);
                          return (
                            <button
                              key={i}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className={`
                                w-full text-left px-1.5 py-0.5 rounded-md text-[10px] md:text-[11px] font-medium truncate
                                ${c.bg} ${c.text} ${c.border} border
                                hover:opacity-80 transition-opacity
                              `}
                              title={`${formatTime(ev.startDateTime)} ${ev.subject}`}
                            >
                              <span className="hidden md:inline">{formatTime(ev.startDateTime)} </span>
                              {ev.subject || 'Event'}
                            </button>
                          );
                        })}
                        {moreCount > 0 && (
                          <div className="text-[10px] font-semibold text-indigo-500 px-1.5 cursor-pointer hover:text-indigo-700">
                            +{moreCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Events Sidebar Card */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Upcoming Events
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingEvents.map((ev, i) => {
              const c = colorForSubject(ev.subject);
              const evDate = ev.startDateTime?.split('T')[0] || '';
              const isEventToday = evDate === today;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors group"
                >
                  {/* Date badge */}
                  <div className={`
                    w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0
                    ${isEventToday ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 border border-slate-200 text-slate-600'}
                  `}>
                    <span className="text-[9px] font-bold uppercase leading-none">
                      {new Date(evDate + 'T00:00:00').toLocaleDateString('en', { month: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold leading-none mt-0.5">
                      {new Date(evDate + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                      {ev.subject || 'Untitled Event'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{formatTime(ev.startDateTime)} – {formatTime(ev.endDateTime)}</span>
                      {ev.isOnlineMeeting && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Teams
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Color accent */}
                  <div className={`w-1.5 h-10 rounded-full ${c.dot} opacity-40 group-hover:opacity-70 transition-opacity`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Events Drawer */}
      {selectedDayEvents && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={() => setSelectedDayEvents(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedDayKey && new Date(selectedDayKey + 'T00:00:00').toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setSelectedDayEvents(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-slate-400 hover:text-slate-600 transition-colors text-lg">×</button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-50">
              {selectedDayEvents.map((ev, i) => {
                const c = colorForSubject(ev.subject);
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDayEvents(null); setSelectedEvent(ev); }}
                    className="w-full text-left px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-1.5 h-10 rounded-full ${c.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{ev.subject || 'Untitled'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatTime(ev.startDateTime)} – {formatTime(ev.endDateTime)}</p>
                    </div>
                    {ev.isOnlineMeeting && (
                      <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">Teams</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Animation keyframes */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
