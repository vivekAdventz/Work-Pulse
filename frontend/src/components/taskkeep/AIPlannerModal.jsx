import { useState, useMemo, useRef } from 'react';
import api from '../../api';

// ─── Icons ─────────────────────────────────────────────
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
);
const UserSmIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CalSmIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const ChevronIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
);

const STEPS = ['PROMPT', 'GENERATE', 'LINK & REVIEW'];

// ─── Dependency validation ────────────────────────────
function isValidDependency(tasks, taskIdx, depTaskNumber) {
  if (!depTaskNumber) return true;
  const task = tasks[taskIdx];
  const depTask = tasks.find(t => t.taskNumber === depTaskNumber);
  if (!depTask) return false;
  // Dependent task must be on same day or earlier
  return depTask.date <= task.date;
}

// ════════════════════════════════════════════════════════
export default function AIPlannerModal({ onClose, fullDb, user, teamProjects, teamMembers, showToast, onPlanExecuted }) {
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState('');
  const [subProjectId, setSubProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const modalRef = useRef();

  const selectedProject = teamProjects.find(p => p.id === projectId);
  const availableSubProjects = useMemo(() =>
    fullDb.subProjects.filter(sp => sp.projectId === projectId),
    [fullDb.subProjects, projectId]
  );

  const charCount = description.trim().length;

  // ── Step 1: Generate ──
  const handleGenerate = async () => {
    setError('');
    if (!projectId) { setError('Please select a project.'); return; }
    if (charCount < 200) { setError('Description too short. Write at least 200 characters.'); return; }
    if (charCount > 1000) { setError('Description too long. Keep under 1000 characters.'); return; }

    setIsGenerating(true);
    setStep(1);
    try {
      const result = await api.generatePlan({ projectId, subProjectId, description });
      setTasks(result.tasks.map((t, i) => ({ ...t, taskNumber: t.taskNumber || i + 1 })));
      setProjectName(result.projectName);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate plan.');
      setStep(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Step 3: Execute ──
  const handleExecute = async () => {
    // Validate dependencies
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].dependsOn && !isValidDependency(tasks, i, tasks[i].dependsOn)) {
        setError(`Task #${tasks[i].taskNumber} has an invalid dependency. A task can only depend on tasks from the same day or earlier.`);
        return;
      }
    }

    setIsExecuting(true);
    setError('');
    try {
      await api.executePlan({ tasks, projectId });
      showToast?.(`Plan executed! ${tasks.length} tasks created.`, 'success');
      onPlanExecuted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to execute plan.');
    } finally {
      setIsExecuting(false);
    }
  };

  // ── Task edit helpers ──
  const updateTaskField = (idx, field, value) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current === e.target) onClose();
  };

  return (
    <div ref={modalRef} onClick={handleBackdropClick} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">AI Project Planner</h2>
              <p className="text-xs font-medium opacity-70">
                {isGenerating ? 'Gemini 2.5 is drafting dependencies & tasks' : 'Create a multi-day task plan with AI'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><XIcon /></button>
        </div>

        {/* ── Step Indicator ── */}
        <div className="px-8 py-3 border-b border-slate-100 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shrink-0">
          {STEPS.map((label, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-200 mx-2">/</span>}
              <span className={step === i ? 'text-indigo-600' : (step > i ? 'text-indigo-300' : 'text-slate-300')}>
                {i + 1}. {label}
              </span>
            </span>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* Step 0: Prompt */}
          {step === 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Project</label>
                  <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setSubProjectId(''); }} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-medium focus:border-indigo-400 focus:ring-0 outline-none transition-all">
                    <option value="">Select Project</option>
                    {teamProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Sub-Project</label>
                  <select value={subProjectId} onChange={(e) => setSubProjectId(e.target.value)} disabled={!projectId} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-medium focus:border-indigo-400 focus:ring-0 outline-none transition-all disabled:bg-slate-50">
                    <option value="">All Sub-Projects</option>
                    {availableSubProjects.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe activity... (e.g., Finalize Q2 audit over 3 days. AI ensures review tasks are scheduled after drafts)"
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm resize-none focus:border-indigo-400 focus:ring-0 outline-none transition-all"
                />
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${charCount > 1000 ? 'text-red-500' : charCount >= 200 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {charCount}/1000 characters (min 200)
                    </span>
                  </div>
                  {error && error.includes('short') && (
                    <p className="text-xs text-red-500 font-bold animate-fadeIn flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
                      Description too short. Write at least 200 characters.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Generating */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
              </div>
              <p className="text-lg font-bold text-slate-700">Generating your plan...</p>
              <p className="text-sm text-slate-400 mt-2">AI is creating tasks, assigning team members, and building dependencies</p>
            </div>
          )}

          {/* Step 2: Link & Review */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800">Verify Sequential Plan</h3>
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full">{tasks.length} MILESTONES</span>
              </div>

              <div className="space-y-4">
                {tasks.map((task, idx) => {
                  const assignee = [...teamMembers, { id: user.id, name: user.name }].find(u => u.id === task.assigneeId);
                  const depValid = !task.dependsOn || isValidDependency(tasks, idx, task.dependsOn);

                  return (
                    <div key={idx} className={`border-2 rounded-2xl p-5 transition-all ${depValid ? 'border-slate-100 hover:border-indigo-100' : 'border-red-200 bg-red-50/30'}`}>
                      {/* Task header row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0">{task.taskNumber}</div>
                        <input
                          value={task.title}
                          onChange={(e) => updateTaskField(idx, 'title', e.target.value)}
                          className="flex-1 min-w-[200px] bg-transparent text-base font-bold text-slate-800 focus:outline-none border-b-2 border-transparent focus:border-indigo-300 transition-all"
                        />

                        {/* Link */}
                        <div className="flex items-center gap-1">
                          <LinkIcon />
                          <select
                            value={task.dependsOn || ''}
                            onChange={(e) => updateTaskField(idx, 'dependsOn', e.target.value ? parseInt(e.target.value) : null)}
                            className={`text-[10px] font-bold uppercase border rounded-md px-2 py-1 outline-none ${task.dependsOn ? (depValid ? 'border-indigo-200 text-indigo-600 bg-indigo-50' : 'border-red-300 text-red-600 bg-red-50') : 'border-slate-200 text-slate-400'}`}
                          >
                            <option value="">NO LINK</option>
                            {tasks.filter((t, i) => i !== idx).map(t => (
                              <option key={t.taskNumber} value={t.taskNumber}>LINK TO #{t.taskNumber}</option>
                            ))}
                          </select>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-1">
                          <UserSmIcon />
                          <select
                            value={task.assigneeId || ''}
                            onChange={(e) => updateTaskField(idx, 'assigneeId', e.target.value || null)}
                            className="text-[10px] font-bold uppercase border border-slate-200 rounded-md px-2 py-1 outline-none"
                          >
                            <option value="">UNASSIGNED</option>
                            {[...teamMembers, { id: user.id, name: user.name }].map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1">
                          <CalSmIcon />
                          <input
                            type="date"
                            value={task.date}
                            onChange={(e) => updateTaskField(idx, 'date', e.target.value)}
                            className="text-[10px] font-bold border border-slate-200 rounded-md px-2 py-1 outline-none"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <textarea
                        value={task.description || ''}
                        onChange={(e) => updateTaskField(idx, 'description', e.target.value)}
                        rows={2}
                        className="mt-3 w-full text-sm text-slate-500 italic bg-transparent resize-none focus:outline-none border-b border-transparent focus:border-slate-200 transition-all"
                        placeholder="Task description..."
                      />

                      {/* SubProject */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Sub-Project:</span>
                        <select
                          value={task.subProjectId || ''}
                          onChange={(e) => updateTaskField(idx, 'subProjectId', e.target.value || null)}
                          className="text-[10px] border border-slate-100 rounded-md px-2 py-0.5 outline-none"
                        >
                          <option value="">Select Sub-Project</option>
                          {availableSubProjects.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                          ))}
                        </select>
                      </div>

                      {!depValid && (
                        <p className="text-[10px] text-red-500 font-bold mt-2">⚠ Invalid: Task #{task.dependsOn} is on a later date. Dependencies must flow forward.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <span className="text-[10px] font-black text-slate-400 uppercase">Plan Review</span>
            </div>
            <p className="text-[9px] text-slate-300 mt-0.5">Dependent tasks must occur on same day or future.</p>
          </div>

          <div className="flex items-center gap-3">
            {error && !error.includes('short') && <span className="text-xs text-red-500 font-medium max-w-[200px] truncate">{error}</span>}

            {step === 2 && (
              <button onClick={() => setStep(0)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Back
              </button>
            )}

            {step === 0 && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
              >
                Generate Plan <SparklesIcon />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
              >
                {isExecuting ? 'Creating...' : 'Execute Plan'} <SparklesIcon />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
