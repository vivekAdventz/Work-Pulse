import { useState, useMemo } from 'react';
import { DeleteIcon, ListIcon } from '../common/Icons';

export default function TaskConfig({ projects, subProjects, tasks, onAdd, onDelete }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSubProject, setSelectedSubProject] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [addError, setAddError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setAddError('');
    if (!selectedProject) { setAddError('Please select a project first.'); return; }
    if (!selectedSubProject) { setAddError('Please select a sub-project first.'); return; }
    if (!newItemName.trim()) { setAddError('Task name cannot be empty.'); return; }
    onAdd(newItemName.trim(), selectedSubProject);
    setNewItemName('');
  };

  const projectSubProjects = useMemo(() => subProjects.filter((sp) => sp.projectId === selectedProject), [subProjects, selectedProject]);
  const currentSubProjectTasks = useMemo(() => tasks.filter((t) => t.subProjectId === selectedSubProject), [tasks, selectedSubProject]);
  
  const selectedProjectObj = projects.find(p => p.id === selectedProject);
  const selectedSubProjectObj = subProjects.find(sp => sp.id === selectedSubProject);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ── Task Scope card (brand teal maybe? use violet for contrast) ── */}
      <div className="bg-violet-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-100 border border-violet-500">
        <div className="flex items-start gap-2.5 mb-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center text-white/80">
            <ListIcon />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight">Task Scope</h3>
            <p className="text-white/60 text-xs mt-0.5 leading-relaxed">Select project and sub-project</p>
          </div>
        </div>

        <div className="relative mt-4 space-y-3">
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => { setSelectedProject(e.target.value); setSelectedSubProject(''); setNewItemName(''); setAddError(''); }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold focus:bg-white/20 focus:border-white/40 outline-none appearance-none cursor-pointer backdrop-blur-sm transition-all"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-violet-700 text-white">Select a Project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-violet-700 text-white">{p.name}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div className="relative">
            <select
              value={selectedSubProject}
              onChange={(e) => { setSelectedSubProject(e.target.value); setNewItemName(''); setAddError(''); }}
              disabled={!selectedProject}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold focus:bg-white/20 focus:border-white/40 outline-none appearance-none cursor-pointer backdrop-blur-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-violet-700 text-white">Select a Sub-Project…</option>
              {projectSubProjects.map((sp) => (
                <option key={sp.id} value={sp.id} className="bg-violet-700 text-white">{sp.name}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Tasks panel ── */}
      {selectedSubProject && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slideDown">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Tasks</h4>
              <p className="text-sm text-slate-500 mt-1">{selectedSubProjectObj?.name} (in {selectedProjectObj?.name})</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{currentSubProjectTasks.length} Total</span>
          </div>

          {/* Add form */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => { setNewItemName(e.target.value); setAddError(''); }}
                placeholder="New Task Name…"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-brand-blue/40 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
              />
              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-xl text-white flex-shrink-0 bg-brand-blue hover:bg-brand-blue-mid transition-colors shadow-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>
            </form>
            {addError && <p className="text-xs text-brand-red mt-1.5 ml-1">⚠ {addError}</p>}
          </div>

          {/* List */}
          <ul className="divide-y divide-slate-50 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {currentSubProjectTasks.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-2.5 group hover:bg-slate-50/70 transition-colors">
                <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-300 hover:text-brand-red rounded-lg hover:bg-brand-red-light opacity-0 group-hover:opacity-100 transition-all">
                  <DeleteIcon />
                </button>
              </li>
            ))}
            {currentSubProjectTasks.length === 0 && (
              <li className="px-5 py-6 text-sm text-center text-slate-400 italic">No tasks yet.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
