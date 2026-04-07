import { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { AiWandIcon } from '../common/Icons';
import api from '../../api';

const MIN_CHARS = 100;
const MAX_CHARS = 300;

export default function TimeEntryForm({ userId, onSaveEntry, onClose, fullDb, initialData }) {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '17:00:00');
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [subProjectId, setSubProjectId] = useState(initialData?.subProjectId || '');
  const [activityTypeId, setActivityTypeId] = useState(initialData?.activityTypeId || '');
  const [priority, setPriority] = useState(initialData?.priority || 'Medium');
  const [workLocation, setWorkLocation] = useState(initialData?.workLocation || 'Office');
  const [teamMemberIds, setTeamMemberIds] = useState(initialData?.teamMemberIds || []);
  const [stakeholderIds, setStakeholderIds] = useState(initialData?.stakeholderIds || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [syncToCalendar, setSyncToCalendar] = useState(false);

  // AI state
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef();

  const isEditing = initialData && initialData.id;

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setStartTime(initialData.startTime || '09:00:00');
      setEndTime(initialData.endTime || '17:00:00');
      setProjectId(initialData.projectId || '');
      setSubProjectId(initialData.subProjectId || '');
      setActivityTypeId(initialData.activityTypeId || '');
      setPriority(initialData.priority || 'Medium');
      setWorkLocation(initialData.workLocation || 'Office');
      setTeamMemberIds(initialData.teamMemberIds || []);
      setStakeholderIds(initialData.stakeholderIds || []);
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  useEffect(() => { setIsVisible(true); }, []);

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const pad = (t) => (t.split(':').length === 2 ? t + ':00' : t);
    const start = new Date(`1970-01-01T${pad(startTime)}`);
    const end = new Date(`1970-01-01T${pad(endTime)}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  const currentUser = useMemo(() => fullDb.users.find(u => u.id === userId), [fullDb.users, userId]);

  const teamUserIds = useMemo(() => {
    if (!currentUser) return [userId];
    const managerId = currentUser.reportsTo || userId;
    const siblings = fullDb.users.filter(u => u.reportsTo === managerId || u.id === managerId);
    const directReports = fullDb.users.filter(u => u.reportsTo === userId);
    return Array.from(new Set([userId, managerId, ...siblings.map(u => u.id), ...directReports.map(u => u.id)]));
  }, [fullDb.users, userId, currentUser]);

  const userProjects = useMemo(() => fullDb.projects.filter((p) => teamUserIds.includes(p.createdBy)), [fullDb.projects, teamUserIds]);
  const userActivityTypes = useMemo(() => fullDb.activityTypes, [fullDb.activityTypes]);
  const userTeamMembers = useMemo(() => {
    const customTeammates = fullDb.teamMembers.filter((i) => teamUserIds.includes(i.createdBy));
    const realUsersAsTeammates = fullDb.users
      .filter(u => teamUserIds.includes(u.id) && u.id !== userId)
      .map(u => ({ id: u.id, name: u.name, isRealUser: true }));
    return [...customTeammates, ...realUsersAsTeammates];
  }, [fullDb.teamMembers, fullDb.users, teamUserIds, userId]);
  const availableSubProjects = useMemo(
    () => fullDb.subProjects.filter((sp) => sp.projectId === projectId && teamUserIds.includes(sp.createdBy)),
    [fullDb.subProjects, projectId, teamUserIds]
  );
  const userStakeholders = useMemo(() => fullDb.stakeholders.filter((s) => teamUserIds.includes(s.createdBy)), [fullDb.stakeholders, teamUserIds]);

  const selectedProject = userProjects.find((p) => p.id === projectId);
  const companies = useMemo(() => {
    if (!selectedProject) return [];
    const ids = selectedProject.companyIds || (selectedProject.companyId ? [selectedProject.companyId] : []);
    return fullDb.companies.filter(c => ids.includes(c.id));
  }, [selectedProject, fullDb.companies]);

  // Derived char state
  const charCount = aiPrompt.length;
  const charOk = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const charColor =
    charCount === 0 ? 'text-slate-400'
    : charCount < MIN_CHARS ? 'text-amber-500'
    : charCount <= MAX_CHARS ? 'text-emerald-600'
    : 'text-red-500';

  const handleFillByAI = async () => {
    setAiError('');
    setAiSuccess(false);
    if (!charOk) {
      setAiError(`Prompt must be between ${MIN_CHARS} and ${MAX_CHARS} characters (currently ${charCount}).`);
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.fillEntryByAI(aiPrompt);

      // Auto-select project
      if (result.projectId) {
        // Check it belongs to this user
        const matchedProject = userProjects.find((p) => p.id === result.projectId);
        if (matchedProject) {
          setProjectId(matchedProject.id);
          // After project set, check subproject
          if (result.subProjectId) {
            const matchedSub = fullDb.subProjects.find(
              (sp) => sp.id === result.subProjectId && sp.projectId === matchedProject.id
            );
            if (matchedSub) setSubProjectId(matchedSub.id);
            else setSubProjectId('');
          } else {
            setSubProjectId('');
          }
        }
      }

      // Auto-select activity type
      if (result.activityTypeId) {
        const matchedActivity = userActivityTypes.find((a) => a.id === result.activityTypeId);
        if (matchedActivity) setActivityTypeId(matchedActivity.id);
      }

      // Fill description
      if (result.description) {
        setDescription(result.description);
      }

      // Auto-select team members
      if (Array.isArray(result.teamMemberIds)) {
        // Filter out IDs that are not in our current team list
        const validIds = result.teamMemberIds.filter(id => 
          userTeamMembers.some(tm => tm.id === id)
        );
        setTeamMemberIds(validIds);
      }

      setAiSuccess(true);
    } catch (err) {
      setAiError(err.message || 'AI failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!projectId) { setFormError('Please select a Project.'); return; }
    if (!subProjectId) { setFormError('Please select a Sub-Project.'); return; }
    if (!activityTypeId) { setFormError('Please select an Activity Type.'); return; }
    if (hours <= 0) { setFormError('End time must be after start time.'); return; }
    onSaveEntry({
      id: isEditing ? initialData.id : undefined,
      userId,
      date,
      startTime,
      endTime,
      hours,
      projectId,
      subProjectId,
      activityTypeId,
      priority,
      workLocation,
      teamMemberIds,
      stakeholderIds,
      description,
      syncToCalendar,
    });
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current === e.target) handleClose();
  };

  const inputClasses = 'mt-1.5 w-full px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-brand-blue/40 focus:ring-0 outline-none transition-all hover:border-slate-200 shadow-sm';
  const readOnlyInputClasses = 'mt-1.5 w-full px-3 py-2.5 border-2 border-slate-100 rounded-xl bg-slate-50 text-sm text-slate-400 font-medium';
  const labelClasses = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider';

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{isEditing ? 'Edit' : 'Add New'} Time Entry</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEditing ? 'Update the details below.' : 'Fill in the details to log your work.'}</p>
          </div>
          <button type="button" onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {/* ── Row 1: Date + Time ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelClasses}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClasses} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Start</label>
                  <input type="time" step="1" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>End</label>
                  <input type="time" step="1" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Hours</label>
                  <input type="text" value={hours.toFixed(2)} readOnly className={readOnlyInputClasses} />
                </div>
              </div>
            </div>

            {/* ── Fill by AI Section ── */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setIsAiActive(!isAiActive)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                <AiWandIcon />
                {isAiActive ? 'Hide Fill by AI' : 'Fill by AI'}
              </button>
            </div>

            {isAiActive && (
              <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                    <AiWandIcon />
                  </div>
                  <span className="text-sm font-semibold text-violet-800">Fill by AI</span>
                  <span className="text-xs text-violet-500 ml-1">— describe your work and AI will fill the form.</span>
                  <span className="text-xs text-orange-500 ml-1 font-medium">Please mention project name!</span>
                </div>

              <div className="relative">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) setAiPrompt(e.target.value);
                    setAiError('');
                    setAiSuccess(false);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleFillByAI(); }}
                  rows={3}
                  placeholder={`Describe what you worked on (${MIN_CHARS}–${MAX_CHARS} chars). Example: "Fixed a critical authentication bug in the login module of the Adventz ERP project. Investigated token expiry issues, updated the JWT middleware and wrote unit tests."`}
                  className={`w-full p-3 pr-16 text-sm border-2 rounded-lg resize-none outline-none transition-colors ${
                    aiError ? 'border-red-300 focus:border-red-400' :
                    aiSuccess ? 'border-emerald-300 focus:border-emerald-400' :
                    'border-violet-200 focus:border-violet-400'
                  } bg-white`}
                />
                {/* Char counter badge inside textarea */}
                <span className={`absolute bottom-3 right-3 text-xs font-mono ${charColor}`}>
                  {charCount}/{MAX_CHARS}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    charCount < MIN_CHARS ? 'bg-amber-400' :
                    charCount <= MAX_CHARS ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${charColor}`}>
                  {charCount === 0 ? `Enter ${MIN_CHARS}–${MAX_CHARS} characters` :
                   charCount < MIN_CHARS ? `${MIN_CHARS - charCount} more characters needed` :
                   charCount <= MAX_CHARS ? `✓ Good length — ${MAX_CHARS - charCount} chars remaining` :
                   `${charCount - MAX_CHARS} chars over limit`}
                </span>
                <button
                  type="button"
                  onClick={handleFillByAI}
                  disabled={isGenerating || !charOk}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white rounded-lg shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>✦ Generate</>
                  )}
                </button>
              </div>

              {/* Error / Success feedback */}
              {aiError && (
                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  <span className="mt-0.5">⚠</span> {aiError}
                </div>
              )}
              {aiSuccess && !aiError && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
                  ✓ Form filled by AI — review and adjust the fields below before saving
                </div>
              )}
            </div>
            )}

            {/* ── Rest of form fields ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

              {/* Project */}
              <div>
                <label className={labelClasses}>Project <span className="text-red-400">*</span></label>
                <select
                  value={projectId}
                  onChange={(e) => { setProjectId(e.target.value); setSubProjectId(''); }}
                  required
                  className={inputClasses}
                >
                  <option value="">Select Project</option>
                  {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Sub-Project */}
              <div>
                <label className={labelClasses}>Sub-Project <span className="text-red-400">*</span></label>
                <select
                  value={subProjectId}
                  onChange={(e) => setSubProjectId(e.target.value)}
                  required
                  disabled={!projectId}
                  className={`${inputClasses} disabled:bg-slate-100`}
                >
                  <option value="">Select Sub-Project</option>
                  {availableSubProjects.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
              </div>

              {/* Company (auto) */}
              <div>
                <label className={labelClasses}>Companies <span className="text-xs text-slate-400">(auto)</span></label>
                <input type="text" value={companies.map(c => c.name).join(', ') || ''} readOnly className={readOnlyInputClasses} />
              </div>

              {/* Activity Type */}
              <div>
                <label className={labelClasses}>Activity Type <span className="text-red-400">*</span></label>
                <select value={activityTypeId} onChange={(e) => setActivityTypeId(e.target.value)} required className={inputClasses}>
                  <option value="">Select Activity</option>
                  {userActivityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Priority + Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClasses}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Location</label>
                  <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={inputClasses}>
                    <option>Office</option>
                    <option>Client</option>
                    <option>Home</option>
                  </select>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <label className={labelClasses}>Team Members <span className="text-[9px] normal-case text-slate-300 font-normal">(Ctrl/Cmd+click)</span></label>
                <select
                  multiple
                  value={teamMemberIds}
                  onChange={(e) => setTeamMemberIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className={`${inputClasses} h-28 overflow-y-auto`}
                >
                  {userTeamMembers.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>

              {/* Stakeholders */}
              <div>
                <label className={labelClasses}>Stakeholders <span className="text-[9px] normal-case text-slate-300 font-normal">(Ctrl/Cmd+click)</span></label>
                <select
                  multiple
                  value={stakeholderIds}
                  onChange={(e) => setStakeholderIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className={`${inputClasses} h-28 overflow-y-auto`}
                >
                  {userStakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClasses}>Description</label>
                  <div className="flex items-center gap-2">
                    {description && (
                      <span className="text-xs text-slate-400">{description.length} chars</span>
                    )}
                  </div>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Enter task description or use Fill by AI above…"
                  className={`${inputClasses} mt-1`}
                />
                {description && description.trim().startsWith('-') && (
                  <div
                    className="mt-2 p-3 border border-violet-100 rounded-lg bg-violet-50 text-sm prose prose-sm prose-violet max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked.parse(description) }}
                  />
                )}
              </div>

              {/* Teams Calendar Sync Toggle */}
              <div className="md:col-span-2">
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  syncToCalendar ? 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50' : 'border-slate-100 bg-gradient-to-r from-slate-50/50 to-white hover:border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md transition-all ${
                      syncToCalendar ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200' : 'bg-slate-300 shadow-slate-200'
                    }`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Sync to Teams Calendar</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {syncToCalendar
                          ? '✓ Will create a Teams meeting event in your calendar'
                          : 'Create a calendar event with Teams meeting link'}
                        {teamMemberIds.length > 0 && syncToCalendar && (
                          <span className="text-indigo-500 font-medium"> • {teamMemberIds.length} attendee{teamMemberIds.length > 1 ? 's' : ''} will be invited</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSyncToCalendar(!syncToCalendar)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 shadow-inner ${
                      syncToCalendar ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      syncToCalendar ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            {formError && (
              <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <span>⚠</span> {formError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-5 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue-mid transition-all shadow-md shadow-brand-blue/20 hover:-translate-y-0.5 active:translate-y-0">
                Save Entry
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
