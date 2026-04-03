import { useState, useMemo } from 'react';
import { DeleteIcon } from './Icons';

export default function SubProjectConfig({ projects, subProjects, onAdd, onDelete }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [addError, setAddError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setAddError('');
    if (!selectedProject) { setAddError('Please select a project first.'); return; }
    if (!newItemName.trim()) { setAddError('Sub-project name cannot be empty.'); return; }
    onAdd(newItemName.trim(), selectedProject);
    setNewItemName('');
  };

  const projectSubProjects = useMemo(() => subProjects.filter((sp) => sp.projectId === selectedProject), [subProjects, selectedProject]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Sub-Projects</h3>
      <div className="flex gap-4 mb-4">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full md:w-1/2 p-2 border border-slate-300 rounded-md bg-white">
          <option value="">Select a Project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {selectedProject && (
        <>
          <form onSubmit={handleAdd} className="flex flex-col gap-1 mb-4">
            <div className="flex gap-2">
              <input type="text" value={newItemName} onChange={(e) => { setNewItemName(e.target.value); setAddError(''); }} placeholder="New Sub-Project Name..." className={`flex-grow p-2 border rounded-md ${addError ? 'border-red-400' : 'border-slate-300'}`} />
              <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add</button>
            </div>
            {addError && <p className="text-xs text-red-500">⚠ {addError}</p>}
          </form>
          <ul className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
            {projectSubProjects.map((item) => (
              <li key={item.id} className="py-2 flex justify-between items-center group">
                <span className="text-sm">{item.name}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600"><DeleteIcon /></button>
                </div>
              </li>
            ))}
            {projectSubProjects.length === 0 && <li className="py-2 text-sm text-center text-slate-400">No sub-projects for this project yet.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
