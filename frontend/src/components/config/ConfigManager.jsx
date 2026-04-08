import { useState } from 'react';
import { EditIcon, DeleteIcon, PlusIcon } from '../common/Icons';

const SectionIcon = ({ title }) => {
  if (title === 'Companies') return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
  if (title === 'Stakeholders') return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
};

export default function ConfigManager({ title, items, onAdd, onDelete, onUpdate }) {
  const [newItemName, setNewItemName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setAddError('');
    if (!newItemName.trim()) { setAddError('Name cannot be empty.'); return; }
    onAdd(newItemName.trim());
    setNewItemName('');
  };

  const handleUpdate = (id) => {
    if (!editingName.trim()) { setEditingId(null); return; }
    onUpdate(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md h-full overflow-hidden p-6">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="text-slate-800"><SectionIcon title={title} /></span>
          {title}
        </h3>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{items.length} Total</span>
      </div>

      {/* Search + Add */}
      <div className="mb-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => { setNewItemName(e.target.value); setAddError(''); }}
              placeholder={`New ${title.slice(0, -1)}...`}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-brand-blue/40 focus:ring-0 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white flex-shrink-0 bg-brand-blue hover:bg-brand-blue-mid transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </form>
        {addError && <p className="text-xs text-brand-red mt-1.5 ml-1">⚠ {addError}</p>}
      </div>

      {/* Item List */}
      <ul className="divide-y divide-slate-50 overflow-y-auto max-h-52 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-5 py-2.5 group hover:bg-slate-50/70 transition-colors">
            {editingId === item.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleUpdate(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(item.id); if (e.key === 'Escape') setEditingId(null); }}
                autoFocus
                className="flex-1 text-sm px-2.5 py-1 border-2 border-brand-blue/30 rounded-lg outline-none mr-2 bg-brand-blue-faint"
              />
            ) : (
              <span className="text-sm text-slate-700 font-medium">{item.name}</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
              <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className="p-1.5 text-slate-400 hover:text-brand-blue rounded-lg hover:bg-brand-blue-faint transition-colors">
                <EditIcon />
              </button>
              <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-brand-red rounded-lg hover:bg-brand-red-light transition-colors">
                <DeleteIcon />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-5 py-8 text-sm text-center text-slate-400 italic">No items yet.</li>
        )}
      </ul>
    </div>
  );
}
