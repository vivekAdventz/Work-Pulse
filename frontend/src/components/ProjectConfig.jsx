import { useState } from 'react';
import { DeleteIcon } from './Icons';

export default function ProjectConfig({ projects, companies, stakeholders, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [stakeholderId, setStakeholderId] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (name.trim() && companyId && stakeholderId) {
      onAdd(name.trim(), companyId, stakeholderId);
      setName('');
      setCompanyId('');
      setStakeholderId('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Projects</h3>
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 items-end">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="New Project Name..." className="md:col-span-1 p-2 border border-slate-300 rounded-md" />
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="md:col-span-1 p-2 border border-slate-300 rounded-md bg-white">
          <option value="">Select Company</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={stakeholderId} onChange={(e) => setStakeholderId(e.target.value)} className="md:col-span-1 p-2 border border-slate-300 rounded-md bg-white">
          <option value="">Select Stakeholder</option>
          {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="md:col-span-1 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add Project</button>
      </form>
      <ul className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
        {projects.map((item) => (
          <li key={item.id} className="py-2 flex justify-between items-center group">
            <div>
              <span className="text-sm font-semibold text-slate-800">{item.name}</span>
              <p className="text-xs text-slate-500">
                {companies.find((c) => c.id === item.companyId)?.name} / {stakeholders.find((s) => s.id === item.stakeholderId)?.name}
              </p>
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
