import { useState, useMemo } from 'react';
import api from '../../api';
import { AiWandIcon } from '../common/Icons';

const STEPS = { PROMPT: 'prompt', REVIEW: 'review', SAVING: 'saving' };

let _lid = 0;
function newLocalId() {
  return `ai_${++_lid}_${Date.now()}`;
}

function normalizeAiSubProjects(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    if (typeof item === 'string') {
      return {
        _localId: newLocalId(),
        id: null,
        name: item,
        description: '',
        _deleted: false,
        tasks: [],
      };
    }
    const spId = newLocalId();
    const taskList = Array.isArray(item.tasks) ? item.tasks : [];
    const tasks = taskList.map((t) => {
      if (typeof t === 'string') {
        return { _localId: newLocalId(), id: null, name: t, description: '', _deleted: false };
      }
      return {
        _localId: newLocalId(),
        id: null,
        name: (t && t.name) || '',
        description: (t && t.description) || '',
        _deleted: false,
      };
    });
    return {
      _localId: spId,
      id: null,
      name: item.name || '',
      description: item.description || '',
      _deleted: false,
      tasks,
    };
  });
}

export default function AiFillModal({ existingProjects, companies, onClose, onSave }) {
  const [step, setStep] = useState(STEPS.PROMPT);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [companyIds, setCompanyIds] = useState([]);
  const [localSubProjects, setLocalSubProjects] = useState([]);
  const [expandedSps, setExpandedSps] = useState(new Set());

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 transition-all';

  const activeSps = useMemo(() => localSubProjects.filter((sp) => !sp._deleted), [localSubProjects]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const config = await api.fillByAI(prompt);
      setProjectName(config.projectName || '');
      setProjectDescription(config.purpose || '');

      const hints = Array.isArray(config.suggestedCompanyNames) ? config.suggestedCompanyNames : [];
      if (hints.length && companies?.length) {
        const matched = companies
          .filter((c) =>
            hints.some(
              (h) =>
                h &&
                (c.name.toLowerCase().includes(String(h).toLowerCase()) ||
                  String(h).toLowerCase().includes(c.name.toLowerCase()))
            )
          )
          .map((c) => c.id);
        setCompanyIds([...new Set(matched)]);
      } else {
        setCompanyIds([]);
      }

      const normalized = normalizeAiSubProjects(config.subProjects);
      setLocalSubProjects(normalized);
      setExpandedSps(new Set(normalized.map((sp) => sp._localId)));
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSubProject = () => {
    const _localId = newLocalId();
    setLocalSubProjects((prev) => [...prev, { _localId, id: null, name: '', description: '', _deleted: false, tasks: [] }]);
    setExpandedSps((prev) => new Set([...prev, _localId]));
  };

  const updateSubProject = (_localId, field, value) =>
    setLocalSubProjects((prev) => prev.map((sp) => (sp._localId === _localId ? { ...sp, [field]: value } : sp)));

  const deleteSubProject = (_localId) =>
    setLocalSubProjects((prev) => prev.map((sp) => (sp._localId === _localId ? { ...sp, _deleted: true } : sp)));

  const toggleExpand = (_localId) =>
    setExpandedSps((prev) => {
      const s = new Set(prev);
      s.has(_localId) ? s.delete(_localId) : s.add(_localId);
      return s;
    });

  const addTask = (spLocalId) => {
    const _localId = newLocalId();
    setLocalSubProjects((prev) =>
      prev.map((sp) =>
        sp._localId === spLocalId
          ? { ...sp, tasks: [...sp.tasks, { _localId, id: null, name: '', description: '', _deleted: false }] }
          : sp
      )
    );
  };

  const updateTask = (spLocalId, taskLocalId, field, value) =>
    setLocalSubProjects((prev) =>
      prev.map((sp) =>
        sp._localId === spLocalId
          ? { ...sp, tasks: sp.tasks.map((t) => (t._localId === taskLocalId ? { ...t, [field]: value } : t)) }
          : sp
      )
    );

  const deleteTask = (spLocalId, taskLocalId) =>
    setLocalSubProjects((prev) =>
      prev.map((sp) =>
        sp._localId === spLocalId
          ? { ...sp, tasks: sp.tasks.map((t) => (t._localId === taskLocalId ? { ...t, _deleted: true } : t)) }
          : sp
      )
    );

  const handleSave = async () => {
    const errs = [];
    if (!projectName.trim()) errs.push('Project name is required.');
    if (companyIds.length === 0) errs.push('Select at least one company.');
    const isDuplicate = existingProjects.some((p) => p.name.toLowerCase() === projectName.trim().toLowerCase());
    if (isDuplicate) errs.push('Project name already exists.');

    activeSps.forEach((sp, i) => {
      if (!sp.name.trim()) errs.push(`Sub-project #${i + 1} needs a name.`);
      sp.tasks
        .filter((t) => !t._deleted)
        .forEach((t, j) => {
          if (!t.name.trim()) errs.push(`Task #${j + 1} in "${sp.name || 'sub-project'}" needs a name.`);
        });
    });

    if (errs.length) {
      setError(errs[0]);
      return;
    }

    setStep(STEPS.SAVING);
    setError('');
    try {
      await onSave({
        projectData: {
          name: projectName.trim(),
          purpose: projectDescription.trim(),
          companyIds,
        },
        localSubProjects,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setStep(STEPS.REVIEW);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== STEPS.SAVING) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4 animate-slideUp">
        {/* Header — match ProjectModal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {step === STEPS.PROMPT && (
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shrink-0">
                <AiWandIcon />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800 truncate">
                {step === STEPS.PROMPT ? 'Fill project with AI' : step === STEPS.SAVING ? 'Creating project…' : 'New project — review'}
              </h2>
              <p className="text-xs text-slate-500">
                {step === STEPS.PROMPT
                  ? 'Describe the project; AI will draft sub-projects and tasks'
                  : step === STEPS.REVIEW
                    ? 'Edit anything, then create — same layout as manual new project'
                    : 'Saving sub-projects and tasks…'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={step === STEPS.SAVING}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {step === STEPS.PROMPT && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Describe your project</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
                  }}
                  rows={6}
                  placeholder='e.g. "Mobile app for Adventz to track attendance; HR is the stakeholder; I lead backend API and integrations."'
                  className={`${inputCls} resize-none`}
                />
                <p className="mt-1.5 text-xs text-slate-400">Ctrl+Enter to generate · Mention project name and your role for best results.</p>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <span>⚠</span> {error}
                </div>
              )}
            </div>
          )}

          {step === STEPS.REVIEW && (
            <>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Project details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Project name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. LexiAI"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="What is this project about?"
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Companies <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-xl min-h-[38px]">
                      {companies.map((c) => {
                        const on = companyIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() =>
                              setCompanyIds((prev) => (on ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                            }
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition-all ${
                              on
                                ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-brand-blue/40'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                      {companies.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No companies — add them in Configuration first.</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sub-projects
                    {activeSps.length > 0 && (
                      <span className="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-bold normal-case">
                        {activeSps.length}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={addSubProject}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-brand-blue-mid transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add sub-project
                  </button>
                </div>

                <div className="space-y-2">
                  {activeSps.map((sp, spIdx) => (
                    <div key={sp._localId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80">
                        <button
                          type="button"
                          onClick={() => toggleExpand(sp._localId)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                        >
                          <svg
                            className={`h-3.5 w-3.5 transition-transform ${expandedSps.has(sp._localId) ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                        <input
                          type="text"
                          value={sp.name}
                          onChange={(e) => updateSubProject(sp._localId, 'name', e.target.value)}
                          placeholder={`Sub-project ${spIdx + 1} name…`}
                          className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-slate-300 min-w-0"
                        />
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {sp.tasks.filter((t) => !t._deleted).length} tasks
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteSubProject(sp._localId)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {expandedSps.has(sp._localId) && (
                        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
                          <textarea
                            value={sp.description}
                            onChange={(e) => updateSubProject(sp._localId, 'description', e.target.value)}
                            placeholder="Sub-project description…"
                            rows={2}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none resize-none focus:border-brand-blue/40 transition-all"
                          />
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasks</span>
                              <button
                                type="button"
                                onClick={() => addTask(sp._localId)}
                                className="flex items-center gap-1 text-[10px] font-semibold text-brand-blue hover:text-brand-blue-mid transition-colors"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add task
                              </button>
                            </div>
                            <div className="space-y-2">
                              {sp.tasks
                                .filter((t) => !t._deleted)
                                .map((task, tIdx) => (
                                  <div key={task._localId} className="border border-slate-100 rounded-lg p-2.5 space-y-1.5 bg-white">
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="h-3 w-3 text-slate-300 shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                      </svg>
                                      <input
                                        type="text"
                                        value={task.name}
                                        onChange={(e) => updateTask(sp._localId, task._localId, 'name', e.target.value)}
                                        placeholder={`Task ${tIdx + 1} name…`}
                                        className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-300 min-w-0"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => deleteTask(sp._localId, task._localId)}
                                        className="p-0.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                      >
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                    <textarea
                                      value={task.description}
                                      onChange={(e) => updateTask(sp._localId, task._localId, 'description', e.target.value)}
                                      placeholder="Task description…"
                                      rows={1}
                                      className="w-full ml-5 px-2 py-1 text-xs border border-slate-100 rounded-lg outline-none resize-none focus:border-brand-blue/30 transition-all bg-slate-50 placeholder:text-slate-300"
                                      style={{ width: 'calc(100% - 1.25rem)' }}
                                    />
                                  </div>
                                ))}
                              {sp.tasks.filter((t) => !t._deleted).length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-2">No tasks yet — add above.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {activeSps.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl">
                      No sub-projects — re-generate or add one.
                    </p>
                  )}
                </div>
              </section>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <span>⚠</span> {error}
                </div>
              )}
            </>
          )}

          {step === STEPS.SAVING && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <svg className="animate-spin h-10 w-10 text-brand-blue" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-600 text-sm font-medium text-center">Creating project, sub-projects, and tasks…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== STEPS.SAVING && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex-wrap">
            {step === STEPS.PROMPT ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl hover:bg-brand-blue-mid transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <AiWandIcon /> Generate
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEPS.PROMPT);
                    setError('');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl hover:bg-brand-blue-mid transition-colors shadow-sm"
                >
                  Create project
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.2s ease-out both; }
      `}</style>
    </div>
  );
}
