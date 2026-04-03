import { useState } from 'react';
import { DeleteIcon, EditIcon } from './Icons';

export default function ProjectConfig({ projects, companies, onAdd, onDelete, onUpdate }) {
  const [name, setName] = useState('');
  const [companyIds, setCompanyIds] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCompanyIds, setEditCompanyIds] = useState([]);
  const [editPurpose, setEditPurpose] = useState('');
  const [editError, setEditError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setAddError('');
    if (!name.trim()) { setAddError('Project name is required.'); return; }
    if (companyIds.length === 0) { setAddError('Please select at least one company.'); return; }
    onAdd(name.trim(), companyIds, purpose.trim());
    setName('');
    setCompanyIds([]);
    setPurpose('');
  };

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditCompanyIds(project.companyIds || (project.companyId ? [project.companyId] : []));
    setEditPurpose(project.purpose || '');
    setEditError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = () => {
    setEditError('');
    if (!editName.trim()) { setEditError('Project name is required.'); return; }
    if (editCompanyIds.length === 0) { setEditError('At least one company is required.'); return; }
    onUpdate(editingId, {
      name: editName.trim(),
      companyIds: editCompanyIds,
      purpose: editPurpose.trim()
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Projects</h3>

      {/* ADD NEW PROJECT FORM */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-start">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 mb-1">Project Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="New Project Name..." className="p-2 border border-slate-300 rounded-md text-sm" />
        </div>
        <div className="flex flex-col max-h-32">
          <label className="text-xs font-bold text-slate-500 mb-1">Companies</label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-md bg-white overflow-y-auto">
            {companies.map((c) => {
              const selected = companyIds.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setCompanyIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${selected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 mb-1">Purpose</label>
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Project Purpose..." rows="3" className="p-2 border border-slate-300 rounded-md text-sm resize-none"></textarea>
        </div>
        <div className="flex flex-col h-full justify-end">
          <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 font-semibold mb-1 w-full md:w-auto">Add Project</button>
        </div>
      </form>
      {addError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <span>⚠</span> {addError}
        </div>
      )}

      {/* PROJECTS TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Companies</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Purpose</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {projects.map((item) => {
              const itemCompanyIds = item.companyIds || (item.companyId ? [item.companyId] : []);
              const isEditing = editingId === item.id;

              return (
                <tr key={item.id} className="hover:bg-slate-50 group">
                  {isEditing ? (
                    <>
                      <td className="px-4 py-3 align-top min-w-[200px]">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" placeholder="Project Name" />
                      </td>
                      <td className="px-4 py-3 align-top min-w-[200px]">
                        <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-300 rounded bg-white overflow-y-auto max-h-24 custom-scrollbar">
                          {companies.map((c) => {
                            const selected = editCompanyIds.includes(c.id);
                            return (
                              <button
                                type="button"
                                key={c.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditCompanyIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                                }}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all ${selected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top min-w-[200px]">
                        <textarea value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none resize-none" rows="2" placeholder="Purpose..." />
                      </td>
                      <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                        {editError && (
                          <div className="mb-1 text-xs text-red-600 text-left">⚠ {editError}</div>
                        )}
                        <button onClick={saveEditing} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded mr-2 font-medium">Save</button>
                        <button onClick={cancelEditing} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded font-medium">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 align-top text-sm font-semibold text-slate-800 break-words">{item.name}</td>
                      <td className="px-4 py-3 align-top text-sm text-slate-600">
                        {companies.filter(c => itemCompanyIds.includes(c.id)).map(c => c.name).join(', ') || 'N/A'}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-slate-600 break-words max-w-xs">{item.purpose || <span className="text-slate-400 italic">No purpose defined</span>}</td>
                      <td className="px-4 py-3 align-top text-right whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(item)} className="text-slate-400 hover:text-sky-600 p-1 mr-1" title="Edit project">
                          <EditIcon />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 p-1" title="Delete project">
                          <DeleteIcon />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {projects.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-400 italic">No projects found for current team view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
