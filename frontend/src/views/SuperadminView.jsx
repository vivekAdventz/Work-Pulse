import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/common/Icons';
import Toast, { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/useConfirm';

function normalizeTagIds(raw) {
  if (!raw?.length) return [];
  return raw.map((x) => (typeof x === 'object' && x !== null && x.id ? x.id : x));
}

export default function SuperadminView({
  user,
  onLogout,
  allUsers,
  setUsers,
  activityTypes = [],
  onRefreshDb,
}) {
  const { toasts, showToast, removeToast } = useToast();
  const { ConfirmModal, confirm } = useConfirm();
  const [mainTab, setMainTab] = useState('team');

  const [activityTags, setActivityTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    try {
      const tags = await api.getActivityTags();
      setActivityTags(tags);
    } catch (e) {
      showToast(e.message || 'Failed to load activity tags', 'error');
    } finally {
      setTagsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const commonTagId = useMemo(
    () => activityTags.find((t) => t.slug === 'common')?.id,
    [activityTags]
  );

  const sortedTypes = useMemo(() => {
    const list = [...activityTypes];
    list.sort((a, b) => {
      const an = typeof a.tagId === 'object' ? a.tagId?.name || '' : '';
      const bn = typeof b.tagId === 'object' ? b.tagId?.name || '' : '';
      if (an !== bn) return an.localeCompare(bn);
      return (a.name || '').localeCompare(b.name || '');
    });
    return list;
  }, [activityTypes]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const initialFormData = { name: '', email: '', roles: ['Employee'], reportsTo: '', activityTagIds: [] };
  const [formData, setFormData] = useState(initialFormData);
  const managers = allUsers.filter((u) => u.roles?.includes('Manager') && u.active);
  const usersToShow = allUsers.filter((u) => !u.roles?.includes('Superadmin'));

  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({ name: '', slug: '', sortOrder: 0 });

  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', tagId: '' });

  const refreshAll = async () => {
    if (onRefreshDb) await onRefreshDb();
    await loadTags();
  };

  const handleAddClick = () => {
    setEditingUser(null);
    const defaultTags = commonTagId ? [commonTagId] : [];
    setFormData({ ...initialFormData, activityTagIds: defaultTags });
    setIsFormOpen(true);
  };

  const handleEditClick = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      roles: userToEdit.roles || ['Employee'],
      reportsTo: userToEdit.reportsTo || '',
      activityTagIds: normalizeTagIds(userToEdit.activityTagIds),
    });
    setIsFormOpen(true);
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const userToUpdate = allUsers.find((u) => u.id === userId);
    if (userToUpdate) {
      try {
        const payload = {
          name: userToUpdate.name,
          email: userToUpdate.email,
          roles: userToUpdate.roles,
          reportsTo: userToUpdate.reportsTo || null,
          activityTagIds: normalizeTagIds(userToUpdate.activityTagIds),
          active: !currentStatus,
        };
        const updatedUser = await api.updateUser(userId, payload);
        setUsers(allUsers.map((u) => (u.id === userId ? updatedUser : u)));
        showToast(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully.`, 'success');
      } catch (error) {
        showToast(`Failed to update user status: ${error.message}`, 'error');
      }
    }
  };

  const handleDeleteClick = async (userId) => {
    const userToDelete = allUsers.find((u) => u.id === userId);
    const ok = await confirm(
      `"${userToDelete?.name}" and all their associated records will be permanently deleted. This cannot be undone.`,
      { title: 'Delete User' }
    );
    if (!ok) return;
    try {
      await api.deleteItem('users', userId);
      setUsers(allUsers.filter((u) => u.id !== userId));
      showToast('User deleted successfully.', 'info');
    } catch (error) {
      showToast(`Failed to delete user: ${error.message}`, 'error');
    }
  };

  const toggleUserTag = (tagId) => {
    setFormData((prev) => {
      const set = new Set(prev.activityTagIds || []);
      if (set.has(tagId)) set.delete(tagId);
      else set.add(tagId);
      return { ...prev, activityTagIds: [...set] };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required.', 'warning');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Email is required.', 'warning');
      return;
    }
    if (allUsers.some((u) => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUser?.id)) {
      showToast('A user with this email already exists.', 'warning');
      return;
    }
    if (formData.roles.includes('Employee') && managers.length === 0) {
      showToast('Cannot create an employee because no managers exist. Please create a manager first.', 'warning');
      return;
    }
    if (formData.roles.includes('Employee') && !formData.reportsTo) {
      showToast('Please select a manager for this employee.', 'warning');
      return;
    }
    if (formData.roles.includes('Employee') && (!formData.activityTagIds || formData.activityTagIds.length === 0)) {
      showToast('Select at least one activity tag for employees.', 'warning');
      return;
    }
    const payload = {
      ...formData,
      reportsTo: formData.roles.includes('Employee') ? formData.reportsTo : null,
      activityTagIds: formData.roles.includes('Employee') ? formData.activityTagIds : [],
    };
    try {
      if (editingUser) {
        const updatedUser = await api.updateUser(editingUser.id, payload);
        setUsers(allUsers.map((u) => (u.id === editingUser.id ? updatedUser : u)));
        showToast('User updated successfully.', 'success');
      } else {
        const newUser = await api.createUser({ ...payload, active: true });
        setUsers([...allUsers, newUser]);
        showToast('User created successfully.', 'success');
      }
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      showToast(`Failed to save user: ${error.message}`, 'error');
    }
  };

  const openNewTag = () => {
    setEditingTag(null);
    setTagForm({ name: '', slug: '', sortOrder: 0 });
    setTagFormOpen(true);
  };

  const openEditTag = (tag) => {
    setEditingTag(tag);
    setTagForm({ name: tag.name, slug: tag.slug, sortOrder: tag.sortOrder ?? 0 });
    setTagFormOpen(true);
  };

  const submitTag = async (e) => {
    e.preventDefault();
    if (!tagForm.name.trim() || !tagForm.slug.trim()) {
      showToast('Name and slug are required.', 'warning');
      return;
    }
    try {
      if (editingTag) {
        await api.updateActivityTag(editingTag.id, tagForm);
        showToast('Tag updated.', 'success');
      } else {
        await api.createActivityTag(tagForm);
        showToast('Tag created.', 'success');
      }
      setTagFormOpen(false);
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteTag = async (tag) => {
    if (tag.slug === 'common') {
      showToast('The common tag cannot be deleted.', 'warning');
      return;
    }
    const ok = await confirm(`Delete tag "${tag.name}"?`, { title: 'Delete tag' });
    if (!ok) return;
    try {
      await api.deleteActivityTag(tag.id);
      showToast('Tag deleted.', 'info');
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openNewType = () => {
    setEditingType(null);
    setTypeForm({
      name: '',
      tagId: commonTagId || activityTags[0]?.id || '',
    });
    setTypeFormOpen(true);
  };

  const openEditType = (t) => {
    const tid = typeof t.tagId === 'object' ? t.tagId?.id : t.tagId;
    setEditingType(t);
    setTypeForm({ name: t.name, tagId: tid || '' });
    setTypeFormOpen(true);
  };

  const submitType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim() || !typeForm.tagId) {
      showToast('Name and tag are required.', 'warning');
      return;
    }
    try {
      if (editingType) {
        await api.updateItem('activityTypes', editingType.id, {
          name: typeForm.name.trim(),
          tagId: typeForm.tagId,
        });
        showToast('Activity type updated.', 'success');
      } else {
        await api.addItem('activityTypes', {
          name: typeForm.name.trim(),
          tagId: typeForm.tagId,
        });
        showToast('Activity type created.', 'success');
      }
      setTypeFormOpen(false);
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const deleteType = async (t) => {
    const ok = await confirm(`Delete activity type "${t.name}"?`, { title: 'Delete activity type' });
    if (!ok) return;
    try {
      await api.deleteItem('activityTypes', t.id);
      showToast('Activity type deleted.', 'info');
      await refreshAll();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 14 0v2"/></svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Administration</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm hidden sm:block">Welcome, <span className="font-semibold text-slate-700">{user.name}</span></span>
          <button onClick={onLogout} className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-xl shadow-sm hover:bg-sky-600 transition-colors">Logout</button>
        </div>
      </header>
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMainTab('team')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 -mb-px transition-colors ${
              mainTab === 'team'
                ? 'border-sky-500 text-sky-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Team Members
          </button>
          <button
            type="button"
            onClick={() => setMainTab('activities')}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 -mb-px transition-colors ${
              mainTab === 'activities'
                ? 'border-sky-500 text-sky-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Activities configuration
          </button>
        </div>

        {mainTab === 'team' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Team Members</h2>
              <p className="text-sm text-slate-400 mt-0.5">Create and manage user accounts and their roles.</p>
            </div>
            <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl shadow-md shadow-brand-blue/20 hover:bg-brand-blue-mid hover:-translate-y-0.5 active:translate-y-0 transition-all w-full md:w-auto justify-center"><PlusIcon /> Add User</button>
          </div>

          {isFormOpen && (
            <div className="mx-6 my-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-slideDown">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">{editingUser ? 'Edit User' : 'New User'}</h3>
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" placeholder="e.g. john@company.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Roles</label>
                  <div className="flex flex-col gap-2 px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white shadow-sm">
                    {['Employee', 'Manager'].map((r) => (
                      <label key={r} className="flex items-center gap-2.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(r)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...formData.roles, r]
                              : formData.roles.filter((x) => x !== r);
                            setFormData({ ...formData, roles: newRoles.length > 0 ? newRoles : [r] });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                        />
                        <span className="font-medium text-slate-700">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.roles.includes('Employee') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reports To</label>
                    <select value={formData.reportsTo} onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm" required>
                      <option value="">Select Manager…</option>
                      {managers.length > 0 ? managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>) : <option disabled>No managers available</option>}
                    </select>
                  </div>
                )}
                {formData.roles.includes('Employee') && (
                  <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Activity tags</label>
                    <div className="flex flex-wrap gap-2 px-3 py-2.5 border-2 border-slate-200 rounded-xl bg-white shadow-sm">
                      {tagsLoading && <span className="text-sm text-slate-400">Loading tags…</span>}
                      {!tagsLoading && activityTags.length === 0 && (
                        <span className="text-sm text-amber-700">No tags yet. Add tags under Activities configuration.</span>
                      )}
                      {activityTags.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.activityTagIds?.includes(t.id)}
                            onChange={() => toggleUserTag(t.id)}
                            className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                          />
                          <span className="font-medium text-slate-700">{t.name}</span>
                          {t.slug === 'common' && <span className="text-[10px] text-slate-400">(default)</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-span-full flex justify-end gap-3 pt-2 border-t border-slate-200 mt-1">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue-mid transition-all shadow-md shadow-brand-blue/20">{editingUser ? 'Update User' : 'Create User'}</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  {['Name', 'Email', 'Roles', 'Activity tags', 'Reports To', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {usersToShow.map((u) => (
                  <tr key={u.id} className="hover:bg-sky-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map(r => (
                          <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${r === 'Manager' ? 'bg-brand-blue-faint text-brand-blue' : r === 'Employee' ? 'bg-brand-green-light text-brand-green-dark' : 'bg-slate-100 text-slate-600'}`}>{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                      {u.roles?.includes('Employee') ? (
                        u.activityTagIds?.length ? (
                          u.activityTagIds.map((tag) => {
                            const id = typeof tag === 'object' && tag?.id ? tag.id : tag;
                            const label = typeof tag === 'object' && tag?.name ? tag.name : activityTags.find((x) => x.id === id)?.name || id;
                            return (
                              <span key={id} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">{label}</span>
                            );
                          })
                        ) : (
                          <span className="text-slate-400">—</span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.reportsTo ? allUsers.find((m) => m.id === u.reportsTo)?.name : <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={u.active} onChange={() => handleToggleActive(u.id, u.active)} />
                          <div className={`block w-11 h-6 rounded-full transition-colors ${u.active ? 'bg-brand-green' : 'bg-slate-200'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${u.active ? 'translate-x-full' : ''}`}></div>
                        </div>
                          <span className={`ml-2.5 text-xs font-semibold ${u.active ? 'text-brand-green' : 'text-slate-400'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(u)} className="text-slate-400 hover:text-brand-blue transition-colors p-1 rounded-lg hover:bg-brand-blue-faint"><EditIcon /></button>
                        <button onClick={() => handleDeleteClick(u.id)} className="text-slate-400 hover:text-brand-red transition-colors p-1 rounded-lg hover:bg-brand-red-light"><DeleteIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {mainTab === 'activities' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Activity tags</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Labels used to group activity types and scope them to employees.</p>
                </div>
                <button type="button" onClick={openNewTag} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl shadow-md shadow-brand-blue/20 hover:bg-brand-blue-mid w-full md:w-auto justify-center"><PlusIcon /> Add tag</button>
              </div>
              {tagFormOpen && (
                <form onSubmit={submitTag} className="mx-6 my-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                    <input className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm" value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Slug</label>
                    <input className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-mono" value={tagForm.slug} onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value })} required disabled={editingTag?.slug === 'common'} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTagFormOpen(false)} className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold">{editingTag ? 'Save' : 'Create'}</button>
                  </div>
                </form>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      {['Name', 'Slug', 'Sort', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activityTags.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50">
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">{t.name}</td>
                        <td className="px-6 py-3 text-sm font-mono text-slate-600">{t.slug}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{t.sortOrder ?? 0}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => openEditTag(t)} className="p-1 text-slate-400 hover:text-brand-blue"><EditIcon /></button>
                            <button type="button" onClick={() => deleteTag(t)} className="p-1 text-slate-400 hover:text-brand-red disabled:opacity-30" disabled={t.slug === 'common'}><DeleteIcon /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Activity types</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Each type belongs to one tag. Employees only see types for tags assigned to them.</p>
                </div>
                <button type="button" onClick={openNewType} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-blue rounded-xl shadow-md shadow-brand-blue/20 hover:bg-brand-blue-mid w-full md:w-auto justify-center"><PlusIcon /> Add activity type</button>
              </div>
              {typeFormOpen && (
                <form onSubmit={submitType} className="mx-6 my-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name</label>
                    <input className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tag</label>
                    <select className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm" value={typeForm.tagId} onChange={(e) => setTypeForm({ ...typeForm, tagId: e.target.value })} required>
                      <option value="">Select tag…</option>
                      {activityTags.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTypeFormOpen(false)} className="px-4 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-semibold">{editingType ? 'Save' : 'Create'}</button>
                  </div>
                </form>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      {['Name', 'Tag', 'Actions'].map((h) => (
                        <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTypes.map((t) => {
                      const tg = typeof t.tagId === 'object' ? t.tagId : null;
                      return (
                        <tr key={t.id} className="border-b border-slate-50">
                          <td className="px-6 py-3 text-sm font-medium text-slate-800">{t.name}</td>
                          <td className="px-6 py-3 text-sm text-slate-600">{tg?.name || '—'}</td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => openEditType(t)} className="p-1 text-slate-400 hover:text-brand-blue"><EditIcon /></button>
                              <button type="button" onClick={() => deleteType(t)} className="p-1 text-slate-400 hover:text-brand-red"><DeleteIcon /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
      {ConfirmModal}
    </div>
  );
}
