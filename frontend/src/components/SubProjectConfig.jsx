import { useState, useMemo } from 'react';
import { DeleteIcon } from './Icons';

export default function SubProjectConfig({ projects, subProjects, onAdd, onDelete }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newItemName.trim() && selectedProject) {
      onAdd(newItemName.trim(), selectedProject);
      setNewItemName('');
    }
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
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="New Sub-Project Name..." className="flex-grow p-2 border border-slate-300 rounded-md" />
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add</button>
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
