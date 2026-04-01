import { useState } from 'react';
import { DeleteIcon } from './Icons';

export default function ProjectConfig({ projects, companies, stakeholders, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [companyIds, setCompanyIds] = useState([]);
  const [stakeholderIds, setStakeholderIds] = useState([]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (name.trim() && companyIds.length > 0 && stakeholderIds.length > 0) {
      onAdd(name.trim(), companyIds, stakeholderIds);
      setName('');
      setCompanyIds([]);
      setStakeholderIds([]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Projects</h3>
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 mb-1">Project Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="New Project Name..." className="p-2 border border-slate-300 rounded-md" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 mb-1">Companies (Ctrl+Click)</label>
          <select multiple value={companyIds} onChange={(e) => setCompanyIds(Array.from(e.target.selectedOptions, o => o.value))} className="p-2 border border-slate-300 rounded-md bg-white h-24">
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 mb-1">Stakeholders (Ctrl+Click)</label>
          <select multiple value={stakeholderIds} onChange={(e) => setStakeholderIds(Array.from(e.target.selectedOptions, o => o.value))} className="p-2 border border-slate-300 rounded-md bg-white h-24">
            {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" className="md:col-span-1 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 self-end mb-1">Add Project</button>
      </form>
      <ul className="divide-y divide-slate-200 mt-4">
        {projects.map((item) => (
          <li key={item.id} className="py-3 flex justify-between items-center group">
            <div>
              <span className="text-sm font-semibold text-slate-800">{item.name}</span>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Companies:</p>
                <p className="text-xs text-slate-600">
                  {companies.filter(c => {
                    const ids = item.companyIds || (item.companyId ? [item.companyId] : []);
                    return ids.includes(c.id);
                  }).map(c => c.name).join(', ') || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Stakeholders:</p>
                <p className="text-xs text-slate-600">
                  {stakeholders.filter(s => {
                    const ids = item.stakeholderIds || (item.stakeholderId ? [item.stakeholderId] : []);
                    return ids.includes(s.id);
                  }).map(s => s.name).join(', ') || 'N/A'}
                </p>
                {item.purpose && (
                  <>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Purpose:</p>
                    <p className="text-xs text-slate-600">{item.purpose}</p>
                  </>
                )}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600"><DeleteIcon /></button>
            </div>
          </li>
        ))}
        {projects.length === 0 && <li className="py-2 text-sm text-center text-slate-400">No items yet.</li>}
      </ul>
    </div>
  );
}
