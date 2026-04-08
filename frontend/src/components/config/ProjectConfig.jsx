import { useState } from 'react';
import { DeleteIcon, EditIcon } from '../common/Icons';

export default function ProjectConfig({ projects, companies, onAdd, onDelete, onUpdate }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
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
    setName(''); setCompanyIds([]); setPurpose('');
    setIsAddOpen(false);
  };

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditCompanyIds(project.companyIds || (project.companyId ? [project.companyId] : []));
    setEditPurpose(project.purpose || '');
    setEditError('');
  };

  const saveEditing = () => {
    setEditError('');
    if (!editName.trim()) { setEditError('Project name is required.'); return; }
    if (editCompanyIds.length === 0) { setEditError('At least one company is required.'); return; }
    onUpdate(editingId, { name: editName.trim(), companyIds: editCompanyIds, purpose: editPurpose.trim() });
    setEditingId(null);
  };

  const CompanyToggle = ({ selected, list, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
      {list.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            type="button"
            key={c.id}
            onClick={() => onChange(prev => on ? prev.filter(id => id !== c.id) : [...prev, c.id])}
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border transition-all ${on ? 'bg-brand-blue text-white border-brand-blue shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-brand-blue/40'}`}
          >
            {c.name}
          </button>
        );
      })}
      {list.length === 0 && <span className="text-xs text-slate-400 italic">No companies — add them first.</span>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800">Active Projects</h2>
        <button
          onClick={() => { setIsAddOpen(!isAddOpen); setAddError(''); }}
          className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Add New
        </button>
      </div>

      {/* Add Form */}
      {isAddOpen && (
        <div className="px-6 py-4 bg-brand-blue-faint border-b border-brand-blue/10 animate-slideDown">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div>
              <label className="block text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1.5">Project Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. LexiAI" className="w-full px-3 py-2 border-2 border-brand-blue/20 rounded-xl bg-white text-sm focus:border-brand-blue/50 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1.5">Companies</label>
              <div className="bg-white rounded-xl border-2 border-brand-blue/20 p-2 min-h-[40px]">
                <CompanyToggle selected={companyIds} list={companies} onChange={setCompanyIds} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Project description..." rows="2" className="w-full px-3 py-2 border-2 border-brand-blue/20 rounded-xl bg-white text-sm resize-none focus:border-brand-blue/50 outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-2 justify-end h-full">
              <button type="submit" className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-mid transition-colors shadow-sm">Add Project</button>
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
          {addError && <p className="text-xs text-brand-red mt-2 font-medium">âš  {addError}</p>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto max-h-[280px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Project Name</th>
              <th className="px-6 py-4 font-semibold">Codes</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((item) => {
              const itemCompanyIds = item.companyIds || (item.companyId ? [item.companyId] : []);
              const isEditing = editingId === item.id;
              const itemCompanies = companies.filter(c => itemCompanyIds.includes(c.id));

              return (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                  {isEditing ? (
                    <>
                      <td className="px-6 py-3 align-top min-w-[180px]">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2.5 py-1.5 border-2 border-brand-blue/30 rounded-xl text-sm outline-none bg-brand-blue-faint" />
                      </td>
                      <td className="px-6 py-3 align-top min-w-[200px]">
                        <div className="bg-white rounded-xl border-2 border-brand-blue/20 p-2">
                          <CompanyToggle selected={editCompanyIds} list={companies} onChange={setEditCompanyIds} />
                        </div>
                      </td>
                      <td className="px-6 py-3 align-top min-w-[200px]">
                        <textarea value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="w-full px-2.5 py-1.5 border-2 border-brand-blue/30 rounded-xl text-sm outline-none resize-none bg-brand-blue-faint" rows="2" />
                      </td>
                      <td className="px-6 py-3 align-top text-right whitespace-nowrap">
                        {editError && <p className="text-xs text-brand-red mb-1 text-left">âš  {editError}</p>}
                        <div className="flex gap-2 justify-end">
                          <button onClick={saveEditing} className="text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-green-dark transition-colors">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {itemCompanies.length > 0 ? itemCompanies.map(c => (
                            <span key={c.id} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                              {c.name}
                            </span>
                          )) : <span className="text-xs text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        <span className="line-clamp-2">{item.purpose || <span className="italic text-slate-300">No description</span>}</span>
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        <button onClick={() => startEditing(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <EditIcon />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
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
                <td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-400 italic">No projects yet. Click "+ Add New" to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
