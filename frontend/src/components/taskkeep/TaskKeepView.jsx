import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../api';
import AIPlannerModal from './AIPlannerModal';
import { useConfirm } from '../common/useConfirm';

// ── Background slideshow images ──────────────────────────
const BG_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1920&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1920&q=80',
];
const BG_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ─── Status styling (icons only — no status labels in UI) ──
const STATUS_CONFIG = {
  todo: { dotCls: 'text-slate-300' },
  doing: { dotCls: 'text-blue-500' },
  done: { dotCls: 'text-emerald-500' },
};

// ─── Inline SVG Icons ──────────────────────────────────
const CircleIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
);
const PlayCircleIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
);
const CheckCircleIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const CalendarSmIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const PlusIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const TrashIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
);
const XIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const BriefcaseIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
);
const ListChecksIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
);
const UserIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const ArrowRightLeftIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3L4 7l4 4" /><path d="M4 7h16" /><path d="M16 21l4-4-4-4" /><path d="M20 17H4" /></svg>
);
const LockIcon = ({ className }) => (
  <svg className={className} width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
);
const ChevronDownIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
);
const SparklesIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);
const UserCircleIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M6 19c0-3 2.5-5 6-5s6 2 6 5" /></svg>
);
const FileTextIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
const LinkIcon = ({ className }) => (
  <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
);

const STATUS_ICONS = { todo: CircleIcon, doing: PlayCircleIcon, done: CheckCircleIcon };

// ─── Color palette for assignees ───────────────────────
const COLORS = [
  'bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700',
];
function getUserColor(userId, allUsers) {
  const idx = allUsers.findIndex(u => u.id === userId);
  return COLORS[idx % COLORS.length] || 'bg-slate-100 text-slate-700';
}

// ─── Dropdown component ────────────────────────────────
function HoverDropdown({ trigger, children, align = 'left', width = 'w-48' }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {trigger}
      {open && (
        <>
          {/* Invisible bridge to prevent gap-dropout */}
          <div className="absolute top-full left-0 right-0 h-2" />
          <div className={`absolute top-[calc(100%+4px)] ${align === 'right' ? 'right-0' : 'left-0'} ${width} bg-white border border-slate-100 shadow-2xl rounded-xl z-30 p-1.5 animate-fadeIn`}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════
export default function TaskKeepView({ user, fullDb, setFullDb, isManager, showToast, onOpenTimeEntryForm }) {
  // ── Background slideshow ──────────────────────────────────
  const [bgIndex, setBgIndex] = useState(0);
  const [bgFading, setBgFading] = useState(false);
  useEffect(() => {
    if (BG_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setBgFading(true);
      setTimeout(() => {
        setBgIndex(i => (i + 1) % BG_IMAGES.length);
        setBgFading(false);
      }, 800);
    }, BG_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const [days, setDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dayToDelete, setDayToDelete] = useState(null);
  const { ConfirmModal, confirm } = useConfirm();
  const [viewingAsUser, setViewingAsUser] = useState(null); // null = manager view (all tasks)
  const [showPlanner, setShowPlanner] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null); // { dayId, taskId, description }

  const debounceTimers = useRef({});

  // ── Team resolution: self + manager + siblings + downward reports ──
  // (mirrors TimeEntryForm so the same projects/subprojects are visible here)
  const teamUserIds = useMemo(() => {
    const allUsers = fullDb.users;
    const currentUser = allUsers.find(u => u.id === user.id);
    const ids = new Set([user.id]);

    // Upward: include direct manager and their team (siblings of current user)
    if (currentUser?.reportsTo) {
      const managerId = currentUser.reportsTo;
      ids.add(managerId);
      allUsers.filter(u => u.reportsTo === managerId).forEach(u => ids.add(u.id));
    }

    // Downward: include all recursive direct reports
    let currentParents = [user.id];
    while (currentParents.length > 0) {
      const children = allUsers.filter(u => currentParents.includes(u.reportsTo) && !ids.has(u.id));
      if (children.length === 0) break;
      const nextParents = [];
      children.forEach(c => { ids.add(c.id); nextParents.push(c.id); });
      currentParents = nextParents;
    }
    return Array.from(ids);
  }, [fullDb.users, user.id]);

  // Downward-only: people the manager can assign tasks to (direct + recursive reports)
  const reporteeIds = useMemo(() => {
    const allUsers = fullDb.users;
    const ids = new Set();
    let currentParents = [user.id];
    while (currentParents.length > 0) {
      const children = allUsers.filter(u => currentParents.includes(u.reportsTo) && !ids.has(u.id));
      if (children.length === 0) break;
      const nextParents = [];
      children.forEach(c => { ids.add(c.id); nextParents.push(c.id); });
      currentParents = nextParents;
    }
    return Array.from(ids);
  }, [fullDb.users, user.id]);

  // Only downward reports are valid assignees; upward manager is excluded
  const teamMembers = useMemo(() =>
    fullDb.users.filter(u => reporteeIds.includes(u.id)),
    [fullDb.users, reporteeIds]
  );

  const teamProjects = useMemo(() =>
    fullDb.projects.filter(p => teamUserIds.includes(p.createdBy)),
    [fullDb.projects, teamUserIds]
  );

  // ── Load data ──
  const loadDays = useCallback(async () => {
    try {
      const data = await api.getTaskDays();
      setDays(data.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      showToast?.(`Failed to load tasks: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDays();
    return () => {
      // Clean up timers on unmount
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [loadDays]);

  // ── Filter days based on role — empty cards are NEVER shown ──
  const filteredDays = useMemo(() => {
    const targetUserId = viewingAsUser || (isManager ? null : user.id);

    // Manager all-tasks view: show every card that has at least one task
    if (!targetUserId) return days.filter(d => d.tasks.length > 0);

    return days
      .map(d => ({
        ...d,
        tasks: d.tasks.filter(t => {
          const assignee = t.assigneeId?.toString();
          const creator = t.createdBy?.toString();

          if (viewingAsUser) {
            // Manager "view as employee" pane: tasks assigned to that employee
            // by someone else (manager-created assignments to this reportee)
            return assignee === targetUserId && creator !== targetUserId;
          }

          // Employee's own tab:
          // - Tasks assigned to me (regardless of who created them).
          // - Tasks I created that have NOT been reassigned to someone else.
          const assignedToMe = assignee === targetUserId;
          const myUnreassignedTask = creator === targetUserId && (!assignee || assignee === targetUserId);
          return assignedToMe || myUnreassignedTask;
        }),
      }))
      // Always require at least one visible task — no empty cards ever
      .filter(d => d.tasks.length > 0);
  }, [days, isManager, user.id, viewingAsUser]);

  // ── Day operations ──
  const handleAddDay = async () => {
    let nextDate = new Date().toISOString().split('T')[0];
    let offset = 0;
    while (days.some(d => d.date === nextDate)) {
      offset++;
      const d = new Date(); d.setDate(d.getDate() + offset);
      nextDate = d.toISOString().split('T')[0];
    }
    try {
      const newDay = await api.createTaskDay(nextDate);
      // Auto-add one empty task so the card is never shown empty
      const dayWithTask = await api.addTaskToDay(newDay.id, {
        title: '',
        assigneeId: isManager ? null : user.id,
        projectId: null,
        status: 'todo',
      });
      setDays(prev => {
        if (prev.some(d => d.id === dayWithTask.id)) return prev;
        return [dayWithTask, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      showToast?.('Date card created.', 'success');
    } catch (err) {
      showToast?.(`Failed to create card: ${err.message}`, 'error');
    }
  };

  const handleUpdateDayDate = async (dayId, newDate) => {
    if (days.some(d => d.id !== dayId && d.date === newDate)) {
      showToast?.('A card for this date already exists.', 'warning'); return;
    }
    try {
      const updated = await api.updateTaskDay(dayId, { date: newDate });
      setDays(prev => prev.map(d => d.id === dayId ? updated : d).sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      showToast?.(`Failed to update date: ${err.message}`, 'error');
    }
  };

  const handleDeleteDay = async () => {
    if (!dayToDelete) return;
    try {
      await api.deleteTaskDay(dayToDelete);
      setDays(prev => prev.filter(d => d.id !== dayToDelete));
      showToast?.('Date card deleted.', 'info');
    } catch (err) {
      showToast?.(`Failed to delete card: ${err.message}`, 'error');
    }
    setDayToDelete(null);
  };

  // ── Task operations ──
  const handleAddTask = async (dayId) => {
    try {
      const taskData = {
        title: '',
        assigneeId: isManager ? null : user.id,
        projectId: null,
        status: 'todo',
      };
      const updated = await api.addTaskToDay(dayId, taskData);
      setDays(prev => prev.map(d => d.id === dayId ? updated : d));
    } catch (err) {
      showToast?.(`Failed to add task: ${err.message}`, 'error');
    }
  };

  const handleUpdateTask = async (dayId, taskId, field, value, debounce = false) => {
    // Special handling: when marking as "done", don't update yet.
    // Open TimeEntryForm first. Only mark done after entry is saved.
    if (field === 'status' && value === 'done') {
      const day = days.find(d => d.id === dayId);
      const task = day?.tasks.find(t => t.id === taskId);
      if (task && onOpenTimeEntryForm) {
        onOpenTimeEntryForm({
          date: day.date,
          projectId: task.projectId || '',
          subProjectId: task.subProjectId || '',
          taskIds: task.catalogTaskId ? [task.catalogTaskId] : [],
          description: task.title || '',
          _taskKeepDayId: dayId,
          _taskKeepTaskId: taskId,
          _refreshTaskKeep: loadDays,
        });
      }
      return;
    }

    // Normal update flow for all other fields
    // Optimistic update
    setDays(prev => prev.map(d => {
      if (d.id !== dayId) return d;
      return { ...d, tasks: d.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t) };
    }));

    // Manage debounce timers
    const timerKey = `${taskId}-${field}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
      delete debounceTimers.current[timerKey];
    }

    if (debounce) {
      debounceTimers.current[timerKey] = setTimeout(async () => {
        try {
          await api.updateTaskInDay(dayId, taskId, { [field]: value });
          delete debounceTimers.current[timerKey];
        } catch (e) {
          console.error('Failed to sync debounced update:', e);
        }
      }, 1000);
      return;
    }

    try {
      const updated = await api.updateTaskInDay(dayId, taskId, { [field]: value });
      
      if (field === 'assigneeId' && value) {
        const assignedUser = fullDb.users.find(u => u.id === value);
        if (assignedUser) {
          showToast?.(`Task assigned to ${assignedUser.name}`, 'success');
        }
      }

      // If we're updating status or project, a full refresh might be needed to maintain consistency
      if (field === 'status' || field === 'projectId' || field === 'assigneeId' || field === 'subProjectId' || field === 'catalogTaskId') {
        loadDays();
      }
    } catch (err) {
      showToast?.(`Failed to update task: ${err.message}`, 'error');
      loadDays(); // Revert optimistic update
    }
  };

  const patchKeepTask = async (dayId, taskId, patch) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        };
      })
    );
    try {
      const updated = await api.updateTaskInDay(dayId, taskId, patch);
      setDays((prev) => prev.map((d) => (d.id === dayId ? updated : d)));
      loadDays();
    } catch (err) {
      showToast?.(`Failed to update task: ${err.message}`, 'error');
      loadDays();
    }
  };

  const handleDeleteTask = async (dayId, taskId) => {
    const day = days.find(d => d.id === dayId);
    const isLastTask = day && day.tasks.length === 1;
    const confirmMsg = isLastTask
      ? 'This is the only task on this card. Deleting it will also remove the card.'
      : 'This task will be permanently deleted.';
    const ok = await confirm(confirmMsg, { title: 'Delete Task' });
    if (!ok) return;
    try {
      if (isLastTask) {
        // Delete the whole day card when its last task is removed
        await api.deleteTaskDay(dayId);
        setDays(prev => prev.filter(d => d.id !== dayId));
      } else {
        const updated = await api.deleteTaskFromDay(dayId, taskId);
        setDays(prev => prev.map(d => d.id === dayId ? updated : d));
      }
    } catch (err) {
      showToast?.(`Failed to delete task: ${err.message}`, 'error');
    }
  };

  const handleMoveTask = async (dayId, taskId, targetDate) => {
    try {
      const { sourceDay, targetDay } = await api.moveTask(dayId, taskId, targetDate);
      setDays(prev => {
        let updated = prev.map(d => {
          if (d.id === sourceDay.id) return sourceDay;
          if (d.id === targetDay.id) return targetDay;
          return d;
        });
        // If target day is new, add it
        if (!prev.some(d => d.id === targetDay.id)) updated.push(targetDay);
        return updated.sort((a, b) => b.date.localeCompare(a.date));
      });
      showToast?.('Task moved successfully.', 'success');
    } catch (err) {
      showToast?.(`Failed to move task: ${err.message}`, 'error');
    }
  };

  const getDayAfter = (dateStr) => {
    const d = new Date(dateStr); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const toggleStatus = (dayId, taskId, currentStatus) => {
    const order = ['todo', 'doing', 'done'];
    const next = order[(order.indexOf(currentStatus) + 1) % order.length];
    handleUpdateTask(dayId, taskId, 'status', next);
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative -m-2 md:-m-8 p-2 md:p-8 min-h-[calc(100vh-84px)]"
      style={{
        backgroundImage: `url(${BG_IMAGES[bgIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        transition: 'opacity 0.8s ease',
        opacity: bgFading ? 0 : 1,
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

    <div className="relative animate-fadeIn">
      {/* ── Top bar: Add Day + Role Switcher ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full px-2">
        {(!viewingAsUser || !isManager) ? (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
            <button onClick={handleAddDay} className="bg-black/20 backdrop-blur-md rounded-xl shadow-md border border-white/20 p-4 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all group flex-1 max-w-xl text-white">
              
              <div className="flex items-center gap-3 text-white/60">
                <CalendarSmIcon className="w-5 h-5" />
                <span className="font-medium group-hover:text-white tracking-tight">Plan task map for a new date...</span>
              </div>
              <PlusIcon className="text-white/60 group-hover:text-white w-6 h-6" />
            </button>
            {/* <button
              onClick={() => setShowPlanner(true)}
              className="flex items-center gap-2 px-5 py-4 bg-indigo-600/30 backdrop-blur-md border border-indigo-300/40 text-white rounded-xl shadow-md shadow-indigo-900/20 hover:bg-indigo-600/40 hover:border-violet-300/50 hover:-translate-y-0.5 transition-all font-bold text-sm shrink-0"
            >
              <SparklesIcon className="w-5 h-5" /> Generate Plan
            </button> */}
          </div>
        ) : (
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-between flex-1 max-w-2xl">
            <div className="flex items-center gap-3 text-white">
              <UserCircleIcon className="w-6 h-6" />
              <div>
                <p className="text-xs font-black uppercase opacity-60">Personal Feed</p>
                <p className="font-bold tracking-tight">
                  Viewing tasks for {viewingAsUser ? fullDb.users.find(u => u.id === viewingAsUser)?.name || 'User' : user.name}
                </p>
              </div>
            </div>
            {isManager && viewingAsUser && (
              <button onClick={() => setViewingAsUser(null)} className="text-white/80 hover:text-white text-xs font-bold uppercase bg-white/20 px-3 py-1 rounded-lg transition-colors">
                Back to All
              </button>
            )}
            {!isManager && <SparklesIcon className="text-white opacity-40 animate-pulse" />}
          </div>
        )}

        {/* Role / Employee Switcher (manager only) */}
        {isManager && (
          <HoverDropdown
            align="right"
            width="w-56"
            trigger={
              <button className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:border-indigo-400 transition-all min-w-[200px]">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold bg-indigo-100 text-indigo-600">
                  {viewingAsUser ? (fullDb.users.find(u => u.id === viewingAsUser)?.name?.[0] || '?') : user.name[0]}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">View As</p>
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {viewingAsUser ? fullDb.users.find(u => u.id === viewingAsUser)?.name : 'All Tasks (Manager)'}
                  </p>
                </div>
                <ChevronDownIcon className="text-slate-400" />
              </button>
            }
          >
            <button
              onClick={() => setViewingAsUser(null)}
              className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl mb-1 flex items-center gap-2 transition-colors ${!viewingAsUser ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}
            >
              <LockIcon className="w-3.5 h-3.5" /> All Tasks (Manager)
            </button>
            <div className="h-px bg-slate-50 my-2 mx-1" />
            <p className="text-[9px] font-black text-slate-300 px-3 py-1 uppercase">Team Members</p>
            <div className="max-h-60 overflow-y-auto">
              {teamMembers.map(u => (
                <button key={u.id} onClick={() => setViewingAsUser(u.id)} className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors ${viewingAsUser === u.id ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}>
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-bold ${getUserColor(u.id, fullDb.users)}`}>{u.name[0]}</div>
                  {u.name}
                </button>
              ))}
            </div>
          </HoverDropdown>
        )}
      </div>

      {/* ── Day Cards (masonry) ── */}
      {filteredDays.length === 0 ? (
        <div className="text-center py-20">
          <CalendarSmIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">
            {isManager ? 'No task cards yet. Click above to plan a new date.' : 'No tasks assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 pb-20">
          {filteredDays.map(day => (
            <div key={day.id} className="break-inside-avoid border border-white/20 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group/card relative flex flex-col bg-black/20 backdrop-blur-md">
              {/* Day header */}
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <CalendarSmIcon className="text-white/60" />
                  <input
                    type="date"
                    value={day.date}
                    onChange={(e) => handleUpdateDayDate(day.id, e.target.value)}
                    className="bg-transparent border-none p-0 font-bold text-white focus:ring-0 text-sm focus:outline-none cursor-pointer"
                  />
                </div>
                {!viewingAsUser && (
                  <button onClick={() => setDayToDelete(day.id)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-full transition-all opacity-40 group-hover/card:opacity-100">
                    <TrashIcon />
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div className="space-y-5 flex-1">
                {day.tasks.map(task => {
                  const assignee = fullDb.users.find(u => u.id === task.assigneeId);
                  const project = fullDb.projects.find(p => p.id === task.projectId);
                  const subProject = fullDb.subProjects?.find(sp => sp.id === task.subProjectId);
                  const resolvedCatalogTask = task.catalogTaskId
                    ? (fullDb.tasks || []).find((ct) => String(ct.id) === String(task.catalogTaskId))
                    : null;
                  const catalogTasksForPick =
                    task.projectId && task.subProjectId
                      ? (fullDb.tasks || []).filter(
                          (ct) =>
                            String(ct.subProjectId) === String(task.subProjectId) &&
                            teamUserIds.includes(ct.createdBy)
                        )
                      : [];
                  const depTask = task.dependsOn
                    ? (day.tasks.find(t => t.id === task.dependsOn) || days.flatMap(d => d.tasks).find(t => t.id === task.dependsOn) || null)
                    : null;
                  const depDone = !depTask || depTask.status === 'done';
                  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                  const StatusIcon = STATUS_ICONS[task.status] || CircleIcon;
                  const canEditTask = isManager || task.createdBy === user.id;
                  const canMoveTask = canEditTask || (!isManager && task.assigneeId === user.id);
                  // Status: assignee only, not already done, and dependency must be done
                  const canChangeStatus = task.assigneeId === user.id && task.status !== 'done' && depDone;
                  const statusBlockReason = !depDone
                    ? `Blocked — "${depTask?.title || 'Linked task'}" must be done first`
                    : task.status === 'done' ? 'Task is complete'
                    : task.assigneeId !== user.id ? 'Only the assignee can change status' : '';
                  const taskSubProjects = task.projectId
                    ? (fullDb.subProjects || []).filter(sp => String(sp.projectId) === String(task.projectId))
                    : [];

                  return (
                    <div key={task.id} className="group/task flex items-start gap-4 relative">
                      {/* Status toggle */}
                      <button
                        onClick={() => canChangeStatus && toggleStatus(day.id, task.id, task.status)}
                        disabled={!canChangeStatus}
                        title={canChangeStatus ? 'Click to change status' : statusBlockReason}
                        className={`mt-0.5 transition-all transform shrink-0 ${canChangeStatus ? 'hover:scale-110 cursor-pointer' : 'opacity-60 cursor-not-allowed'} ${status.dotCls}`}
                      >
                        <StatusIcon className={status.dotCls} />
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2 group/title">
                          <textarea
                            value={task.title}
                            readOnly={!canEditTask}
                            rows={1}
                            onChange={(e) => handleUpdateTask(day.id, task.id, 'title', e.target.value, true)}
                            onBlur={(e) => { if (canEditTask && e.target.value !== task.title) handleUpdateTask(day.id, task.id, 'title', e.target.value); }}
                            onInput={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                            placeholder="Task details..."
                            className={`flex-1 bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none font-semibold resize-none overflow-hidden min-h-[1.25rem] ${task.status === 'done' ? 'line-through text-white/50 decoration-2' : 'text-white'}`}
                          />
                          <button 
                            onClick={() => setNoteToEdit({ dayId: day.id, taskId: task.id, description: task.description || '' })}
                            className={`p-1.5 rounded-lg transition-all shrink-0 mt-[-2px] ${task.description ? 'text-indigo-300 bg-indigo-500/20 shadow-sm border border-indigo-500/30' : 'text-white/50 hover:text-indigo-300 hover:bg-white/10'}`}
                            title={task.description ? 'View/Edit Notes' : 'Add Notes'}
                          >
                            <FileTextIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-white/80 leading-relaxed font-medium line-clamp-2 px-0.5 border-l-2 border-white/20 pl-2 my-1">
                            {task.description}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Project picker */}
                          <HoverDropdown width="w-52" trigger={
                            <button disabled={!canEditTask} className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-md border border-dashed border-white/30">
                              <BriefcaseIcon className={project ? 'text-indigo-300' : 'text-white/50'} />
                              <span className={`text-[9px] font-bold uppercase truncate max-w-[80px] ${project ? 'text-indigo-200' : 'text-white/60'}`}>
                                {project ? project.name : 'Project'}
                              </span>
                            </button>
                          }>
                            {canEditTask && (
                              <div className="max-h-[150px] overflow-y-auto pr-1">
                                {teamProjects.map(p => (
                                  <button
                                    key={p.id}
                                    onClick={() =>
                                      patchKeepTask(day.id, task.id, {
                                        projectId: p.id,
                                        subProjectId: null,
                                        catalogTaskId: null,
                                      })
                                    }
                                    className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-indigo-50 rounded-lg flex items-center justify-between"
                                  >
                                    <span className="font-medium text-slate-600">{p.name}</span>
                                    {task.projectId === p.id && <CheckIcon className="text-indigo-500" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </HoverDropdown>

                          {/* SubProject picker */}
                          {task.projectId && (
                            <HoverDropdown width="w-52" trigger={
                              <button disabled={!canEditTask} className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-md border border-dashed border-white/30">
                                <BriefcaseIcon className={subProject ? 'text-violet-300' : 'text-white/50'} />
                                <span className={`text-[9px] font-bold uppercase truncate max-w-[80px] ${subProject ? 'text-violet-200' : 'text-white/60'}`}>
                                  {subProject ? subProject.name : 'Subproject'}
                                </span>
                              </button>
                            }>
                              {canEditTask && (
                                <div className="max-h-[150px] overflow-y-auto pr-1">
                                  {taskSubProjects.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic px-2 py-2">No phases for this project</p>
                                  )}
                                  {taskSubProjects.map(sp => (
                                    <button
                                      key={sp.id}
                                      onClick={() =>
                                        patchKeepTask(day.id, task.id, { subProjectId: sp.id, catalogTaskId: null })
                                      }
                                      className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-violet-50 rounded-lg flex items-center justify-between"
                                    >
                                      <span className="font-medium text-slate-600">{sp.name}</span>
                                      {task.subProjectId === sp.id && <CheckIcon className="text-violet-500" />}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </HoverDropdown>
                          )}

                          {/* Catalog task picker (workspace tasks tied to phase) */}
                          {task.projectId && task.subProjectId && (
                            <HoverDropdown width="w-56" trigger={
                              <button disabled={!canEditTask} className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-md border border-dashed border-white/30">
                                <ListChecksIcon className={resolvedCatalogTask ? 'text-emerald-300' : 'text-white/50'} />
                                <span className={`text-[9px] font-bold uppercase truncate max-w-[80px] ${resolvedCatalogTask ? 'text-emerald-200' : 'text-white/60'}`}>
                                  {resolvedCatalogTask
                                    ? resolvedCatalogTask.name
                                    : task.catalogTaskId
                                      ? 'Unavailable'
                                      : 'Task'}
                                </span>
                              </button>
                            }>
                              {canEditTask && (
                                <div className="max-h-[150px] overflow-y-auto pr-1">
                                  <button
                                    type="button"
                                    onClick={() => patchKeepTask(day.id, task.id, { catalogTaskId: null })}
                                    className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-slate-50 rounded-lg flex items-center justify-between text-slate-500 border-b border-slate-100 mb-1"
                                  >
                                    <span className="font-medium italic">None</span>
                                    {!task.catalogTaskId && <CheckIcon className="text-slate-400" />}
                                  </button>
                                  {catalogTasksForPick.map((ct) => (
                                    <button
                                      key={ct.id}
                                      type="button"
                                      onClick={() => patchKeepTask(day.id, task.id, { catalogTaskId: ct.id })}
                                      className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-emerald-50 rounded-lg flex items-center justify-between"
                                    >
                                      <span className="font-medium text-slate-600 truncate">{ct.name}</span>
                                      {String(ct.id) === String(task.catalogTaskId) ? (
                                        <CheckIcon className="text-emerald-500 shrink-0 ml-1" />
                                      ) : null}
                                    </button>
                                  ))}
                                  {catalogTasksForPick.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic px-2 py-2">No tasks for this phase</p>
                                  )}
                                </div>
                              )}
                            </HoverDropdown>
                          )}

                          {/* Dependency badge */}
                          {depTask && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ${depDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`} title={depDone ? `✅ "${depTask.title}" is done` : `🚫 Blocked — "${depTask.title}" not done yet`}>
                              {depDone ? '✅' : '🔒'} {depTask.title?.substring(0, 20) || 'Task'}
                            </span>
                          )}

                          {/* Dependency linker (manager or task owner) */}
                          {canEditTask && (
                            <HoverDropdown align="right" width="w-52" trigger={
                              <button className={`flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-md border border-dashed border-white/30 ${task.dependsOn ? 'border-amber-300/50' : ''}`}>
                                <LinkIcon className={task.dependsOn ? 'text-amber-300' : 'text-white/50'} />
                                <span className={`text-[9px] font-bold uppercase ${task.dependsOn ? 'text-amber-200' : 'text-white/60'}`}>
                                  {task.dependsOn ? 'Linked' : 'Link'}
                                </span>
                              </button>
                            }>
                              <p className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase px-1">Depends On</p>
                              {task.dependsOn && (
                                <button
                                  onClick={() => handleUpdateTask(day.id, task.id, 'dependsOn', null)}
                                  className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-red-50 rounded-lg font-medium text-red-500 mb-1 border-b border-slate-50 pb-2"
                                >
                                  ✕ Remove Link
                                </button>
                              )}
                              <div className="max-h-40 overflow-y-auto pr-1">
                                {/* Show tasks from same day + earlier days that are not this task */}
                                {days
                                  .filter(d => d.date <= day.date)
                                  .flatMap(d => d.tasks.map(t => ({ ...t, dayDate: d.date, dayId: d.id })))
                                  .filter(t => t.id !== task.id)
                                  .map(t => (
                                    <button
                                      key={t.id}
                                      onClick={() => handleUpdateTask(day.id, task.id, 'dependsOn', t.id)}
                                      className={`w-full text-left px-2 py-1.5 text-[10px] hover:bg-amber-50 rounded-lg flex items-center justify-between gap-1 ${task.dependsOn === t.id ? 'bg-amber-50' : ''}`}
                                    >
                                      <span className="font-medium text-slate-600 truncate">{t.title || 'Untitled'}</span>
                                      <span className="text-[8px] text-slate-400 shrink-0">{t.dayDate === day.date ? 'today' : t.dayDate.slice(5)}</span>
                                      {task.dependsOn === t.id && <CheckIcon className="text-amber-500 shrink-0" />}
                                    </button>
                                  ))}
                                {days.filter(d => d.date <= day.date).flatMap(d => d.tasks).filter(t => t.id !== task.id).length === 0 && (
                                  <p className="text-[10px] text-slate-400 italic px-2 py-2">No other tasks available</p>
                                )}
                              </div>
                            </HoverDropdown>
                          )}

                          {/* Assignee picker (manager only, requires project) */}
                          {isManager && !task.projectId ? (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md opacity-50 cursor-not-allowed" title="Select a project first">
                              <UserIcon className="text-white/50" />
                              <span className="text-[9px] font-bold uppercase text-white/50">Project first</span>
                            </span>
                          ) : (
                            <HoverDropdown width="w-40" trigger={
                              <button disabled={!isManager} className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded-md">
                                {assignee ? (
                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold ${getUserColor(assignee.id, fullDb.users)}`}>{assignee.name[0]}</div>
                                ) : <UserIcon className="text-white/50" />}
                                <span className={`text-[9px] font-bold uppercase ${assignee ? 'text-white/90' : 'text-white/60'}`}>
                                  {assignee ? assignee.name : 'Assign'}
                                </span>
                              </button>
                            }>
                              {isManager && (
                                <>
                                  {teamMembers.map(u => (
                                    <button key={u.id} onClick={() => handleUpdateTask(day.id, task.id, 'assigneeId', u.id)} className="w-full text-left px-2 py-1 text-[10px] hover:bg-slate-50 rounded-lg flex items-center gap-2 font-medium">
                                      <div className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold ${getUserColor(u.id, fullDb.users)}`}>{u.name[0]}</div>
                                      {u.name}
                                    </button>
                                  ))}
                                  <button onClick={() => handleUpdateTask(day.id, task.id, 'assigneeId', user.id)} className="w-full text-left px-2 py-1 text-[10px] hover:bg-slate-50 rounded-lg flex items-center gap-2 font-medium border-t border-slate-50 mt-1 pt-1">
                                    <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold bg-indigo-100 text-indigo-600">{user.name[0]}</div>
                                    {user.name} (self)
                                  </button>
                                </>
                              )}
                            </HoverDropdown>
                          )}

                          {/* Move task */}
                          {canMoveTask && (
                            <HoverDropdown align="right" width="w-40" trigger={
                              <button className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded-md text-white/60 hover:text-indigo-300 transition-colors">
                                <ArrowRightLeftIcon /> <span className="text-[9px] font-bold uppercase">Move</span>
                              </button>
                            }>
                              <p className="text-[9px] font-bold text-slate-400 mb-2 uppercase px-1">Move to Date</p>
                              <input type="date" className="w-full text-[10px] border border-slate-100 rounded-md p-1.5 mb-2 outline-none" onChange={(e) => handleMoveTask(day.id, task.id, e.target.value)} />
                              <button onClick={() => handleMoveTask(day.id, task.id, getDayAfter(day.date))} className="w-full text-left px-3 py-2 text-[10px] hover:bg-slate-50 rounded font-medium text-slate-600 transition-colors">
                                Move to Next Day
                              </button>
                            </HoverDropdown>
                          )}

                          {/* Locked indicator */}
                          {!canEditTask && (
                            <div className="flex items-center gap-1 px-1 opacity-50 grayscale text-white/50" title="Manager-assigned task. Read-only.">
                              <LockIcon /> <span className="text-[7px] font-bold uppercase">Locked</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete task — always visible on hover; disabled if created by manager */}
                      <button
                        onClick={() => canEditTask && handleDeleteTask(day.id, task.id)}
                        disabled={!canEditTask}
                        title={canEditTask ? 'Delete task' : 'Cannot delete — this task was assigned by your manager'}
                        className={`opacity-0 group-hover/task:opacity-100 p-1 transition-opacity ${canEditTask ? 'text-white/40 hover:text-red-400 cursor-pointer' : 'text-white/20 cursor-not-allowed'}`}
                      >
                        <XIcon />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add task button */}
              <button
                onClick={() => handleAddTask(day.id)}
                className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300 hover:text-indigo-200 transition-all py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 w-full justify-center"
              >
                <PlusIcon /> Create Task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete Day Modal ── */}
      {dayToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <TrashIcon className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Card?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">This will permanently remove the day card and all its associated tasks. This action cannot be undone.</p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={() => setDayToDelete(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDeleteDay} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-100">Delete Card</button>
            </div>
          </div>
        </div>
      )}
      {/* ── AI Planner Modal ── */}
      {showPlanner && (
        <AIPlannerModal
          onClose={() => setShowPlanner(false)}
          fullDb={fullDb}
          user={user}
          teamProjects={teamProjects}
          teamMembers={teamMembers}
          showToast={showToast}
          onPlanExecuted={loadDays}
        />
      )}
      {/* ── Edit Note Modal ── */}
      {noteToEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-slate-100">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileTextIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-700">Task Notes</h3>
              </div>
              <button 
                onClick={() => setNoteToEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                autoFocus
                className="w-full h-40 bg-slate-50 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none placeholder:text-slate-300 resize-none text-slate-600 font-medium leading-relaxed"
                placeholder="Description, notes, or links for this task..."
                value={noteToEdit.description}
                onChange={(e) => setNoteToEdit({ ...noteToEdit, description: e.target.value })}
              />
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-2 text-right">
              <button 
                onClick={() => setNoteToEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  await handleUpdateTask(noteToEdit.dayId, noteToEdit.taskId, 'description', noteToEdit.description);
                  setNoteToEdit(null);
                }}
                className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-100"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
      {ConfirmModal}
    </div>
    </div>
  );
}
