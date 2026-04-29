import { useState, useEffect } from 'react';

let _localIdCounter = 0;
function newLocalId() {
  return `local_${++_localIdCounter}`;
}

function buildLocalSubProjects(project, subProjects, tasks) {
  if (!project) return [];
  return subProjects
    .filter(sp => sp.projectId === project.id)
    .map(sp => ({
      _localId: sp.id,
      id: sp.id,
      name: sp.name,
      description: sp.description || '',
      _deleted: false,
      tasks: tasks
        .filter(t => t.subProjectId === sp.id)
        .map(t => ({
          _localId: t.id,
          id: t.id,
          name: t.name,
          description: t.description || '',
          _deleted: false,
        })),
    }));
}

export default function ProjectModal({ project, companies, subProjects, tasks, onSave, onClose }) {
  const [projectName, setProjectName] = useState(project?.name || '');
  const [projectDescription, setProjectDescription] = useState(project?.purpose || '');
  const [companyIds, setCompanyIds] = useState(
    project?.companyIds || (project?.companyId ? [project.companyId] : [])
  );
  const [localSubProjects, setLocalSubProjects] = useState(() =>
    buildLocalSubProjects(project, subProjects, tasks)
  );
  const [expandedSps, setExpandedSps] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Sub-project helpers ── */
  const addSubProject = () => {
    const _localId = newLocalId();
    setLocalSubProjects(prev => [...prev, { _localId, id: null, name: '', description: '', _deleted: false, tasks: [] }]);
    setExpandedSps(prev => new Set([...prev, _localId]));
  };

  const updateSubProject = (_localId, field, value) =>
    setLocalSubProjects(prev => prev.map(sp => sp._localId === _localId ? { ...sp, [field]: value } : sp));

  const deleteSubProject = (_localId) =>
    setLocalSubProjects(prev => prev.map(sp => sp._localId === _localId ? { ...sp, _deleted: true } : sp));

  const toggleExpand = (_localId) =>
    setExpandedSps(prev => {
      const s = new Set(prev);
      s.has(_localId) ? s.delete(_localId) : s.add(_localId);
      return s;
    });

  /* ── Task helpers ── */
  const addTask = (spLocalId) => {
    const _localId = newLocalId();
    setLocalSubProjects(prev => prev.map(sp =>
      sp._localId === spLocalId
        ? { ...sp, tasks: [...sp.tasks, { _localId, id: null, name: '', description: '', _deleted: false }] }
        : sp
    ));
  };

  const updateTask = (spLocalId, taskLocalId, field, value) =>
    setLocalSubProjects(prev => prev.map(sp =>
      sp._localId === spLocalId
        ? { ...sp, tasks: sp.tasks.map(t => t._localId === taskLocalId ? { ...t, [field]: value } : t) }
        : sp
    ));

  const deleteTask = (spLocalId, taskLocalId) =>
    setLocalSubProjects(prev => prev.map(sp =>
      sp._localId === spLocalId
        ? { ...sp, tasks: sp.tasks.map(t => t._localId === taskLocalId ? { ...t, _deleted: true } : t) }
        : sp
    ));

  /* ── Save ── */
  const handleSave = async () => {
    const errs = {};
    if (!projectName.trim()) errs.name = 'Project name is required.';
    if (companyIds.length === 0) errs.companies = 'Select at least one company.';

    localSubProjects.filter(sp => !sp._deleted).forEach((sp, i) => {
      if (!sp.name.trim()) errs[`sp_${sp._localId}`] = `Sub-project #${i + 1} needs a name.`;
      sp.tasks.filter(t => !t._deleted).forEach((t, j) => {
        if (!t.name.trim()) errs[`task_${t._localId}`] = `Task #${j + 1} in "${sp.name || `sub-project ${i + 1}`}" needs a name.`;
      });
    });

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSaving(true);
    try {
      await onSave(
        { name: projectName.trim(), purpose: projectDescription.trim(), companyIds },
        localSubProjects
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-brand-blue/50 transition-all';
  const activeSps = localSubProjects.filter(sp => !sp._deleted);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* ── Project details ── */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Project Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. LexiAI"
                  className={inputCls}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
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
                  {companies.map(c => {
                    const on = companyIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCompanyIds(prev => on ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition-all ${on ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-brand-blue/40'}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                  {companies.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No companies — add them first.</span>
                  )}
                </div>
                {errors.companies && <p className="text-xs text-red-500 mt-1">{errors.companies}</p>}
              </div>
            </div>
          </section>

          {/* ── Sub-projects ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sub-Projects
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
                Add Sub-Project
              </button>
            </div>

            <div className="space-y-2">
              {activeSps.map((sp, spIdx) => (
                <div key={sp._localId} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Sub-project header row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80">
                    <button
                      type="button"
                      onClick={() => toggleExpand(sp._localId)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${expandedSps.has(sp._localId) ? 'rotate-90' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                      </svg>
                    </button>

                    <input
                      type="text"
                      value={sp.name}
                      onChange={e => updateSubProject(sp._localId, 'name', e.target.value)}
                      placeholder={`Sub-project ${spIdx + 1} name…`}
                      className="flex-1 text-sm font-medium bg-transparent outline-none placeholder:text-slate-300 min-w-0"
                    />

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {sp.tasks.filter(t => !t._deleted).length} tasks
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

                  {errors[`sp_${sp._localId}`] && (
                    <p className="text-xs text-red-500 px-4 py-1 bg-red-50">{errors[`sp_${sp._localId}`]}</p>
                  )}

                  {/* Expanded: description + tasks */}
                  {expandedSps.has(sp._localId) && (
                    <div className="px-4 pb-4 pt-3 space-y-3 border-t border-slate-100">
                      <textarea
                        value={sp.description}
                        onChange={e => updateSubProject(sp._localId, 'description', e.target.value)}
                        placeholder="Sub-project description…"
                        rows={2}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none resize-none focus:border-brand-blue/40 transition-all"
                      />

                      {/* Tasks */}
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
                            Add Task
                          </button>
                        </div>

                        <div className="space-y-2">
                          {sp.tasks.filter(t => !t._deleted).map((task, tIdx) => (
                            <div key={task._localId} className="border border-slate-100 rounded-lg p-2.5 space-y-1.5 bg-white">
                              <div className="flex items-center gap-2">
                                <svg className="h-3 w-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                                </svg>
                                <input
                                  type="text"
                                  value={task.name}
                                  onChange={e => updateTask(sp._localId, task._localId, 'name', e.target.value)}
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
                              {errors[`task_${task._localId}`] && (
                                <p className="text-xs text-red-500 ml-5">{errors[`task_${task._localId}`]}</p>
                              )}
                              <textarea
                                value={task.description}
                                onChange={e => updateTask(sp._localId, task._localId, 'description', e.target.value)}
                                placeholder="Task description…"
                                rows={1}
                                className="w-full ml-5 px-2 py-1 text-xs border border-slate-100 rounded-lg outline-none resize-none focus:border-brand-blue/30 transition-all bg-slate-50 placeholder:text-slate-300"
                                style={{ width: 'calc(100% - 1.25rem)' }}
                              />
                            </div>
                          ))}
                          {sp.tasks.filter(t => !t._deleted).length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-2">
                              No tasks yet — click "+ Add Task" above.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {activeSps.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl">
                  No sub-projects yet — click "+ Add Sub-Project" above.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl hover:bg-brand-blue-mid transition-colors shadow-sm disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
