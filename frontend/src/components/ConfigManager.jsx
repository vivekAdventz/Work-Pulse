import { useState } from 'react';
import { EditIcon, DeleteIcon } from './Icons';

export default function ConfigManager({ title, items, onAdd, onDelete, onUpdate }) {
  const [newItemName, setNewItemName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setAddError('');
    if (!newItemName.trim()) {
      setAddError(`${title.slice(0, -1)} name cannot be empty.`);
      return;
    }
    onAdd(newItemName.trim());
    setNewItemName('');
  };

  const handleUpdate = (id) => {
    setEditError('');
    if (!editingName.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }
    onUpdate(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
      <form onSubmit={handleAdd} className="flex flex-col gap-1 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => { setNewItemName(e.target.value); setAddError(''); }}
            placeholder={`New ${title.slice(0, -1)}...`}
            className={`flex-grow p-2 border rounded-md focus:ring-2 focus:ring-sky-500 ${addError ? 'border-red-400' : 'border-slate-300'}`}
          />
          <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors">
            Add
          </button>
        </div>
        {addError && <p className="text-xs text-red-500 mt-0.5">⚠ {addError}</p>}
      </form>
      <ul className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="py-2 flex justify-between items-center group">
            {editingId === item.id ? (
              <div className="flex flex-col gap-0.5 flex-1 mr-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => { setEditingName(e.target.value); setEditError(''); }}
                  onBlur={() => handleUpdate(item.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                  autoFocus
                  className={`p-1 border rounded-md ${editError ? 'border-red-400' : 'border-sky-500'}`}
                />
                {editError && <p className="text-xs text-red-500">⚠ {editError}</p>}
              </div>
            ) : (
              <span className="text-sm text-slate-800">{item.name}</span>
            )}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingId(item.id); setEditingName(item.name); }} className="text-slate-400 hover:text-sky-600">
                <EditIcon />
              </button>
              <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600">
                <DeleteIcon />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-sm text-center text-slate-400">No items yet.</li>}
      </ul>
    </div>
  );
}
