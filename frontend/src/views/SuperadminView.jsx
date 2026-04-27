import { useState } from 'react';
import api from '../api';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/common/Icons';
import Toast, { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/useConfirm';

export default function SuperadminView({ user, onLogout, allUsers, setUsers }) {
  const { toasts, showToast, removeToast } = useToast();
  const { ConfirmModal, confirm } = useConfirm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const initialFormData = { name: '', email: '', roles: ['Employee'], reportsTo: '' };
  const [formData, setFormData] = useState(initialFormData);
  const managers = allUsers.filter((u) => u.roles?.includes('Manager') && u.active);
  const usersToShow = allUsers.filter((u) => !u.roles?.includes('Superadmin'));

  const handleAddClick = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setIsFormOpen(true);
  };

  const handleEditClick = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({ name: userToEdit.name, email: userToEdit.email, roles: userToEdit.roles || ['Employee'], reportsTo: userToEdit.reportsTo || '' });
    setIsFormOpen(true);
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const userToUpdate = allUsers.find((u) => u.id === userId);
    if (userToUpdate) {
      try {
        const updatedUser = await api.updateUser(userId, { ...userToUpdate, active: !currentStatus });
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
    const payload = {
      ...formData,
      reportsTo: formData.roles.includes('Employee') ? formData.reportsTo : null,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 14 0v2"/></svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">User Administration</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm hidden sm:block">Welcome, <span className="font-semibold text-slate-700">{user.name}</span></span>
          <button onClick={onLogout} className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 rounded-xl shadow-sm hover:bg-sky-600 transition-colors">Logout</button>
        </div>
      </header>
      <div
        className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-2.5 md:px-8"
        role="status"
      >
        <div className="max-w-7xl mx-auto flex items-start gap-2 md:gap-3">
          <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </span>
          <p className="text-xs md:text-sm text-amber-900/90 leading-relaxed">
            <span className="font-semibold">Before end users add entries:</span>{' '}
            ask them to complete <span className="font-medium">projects</span>, <span className="font-medium">subprojects</span>, <span className="font-medium">tasks</span>, <span className="font-medium">team members</span>, and <span className="font-medium">stakeholder</span> (and company) details in the <span className="font-semibold">Configuration</span> tab in the app.
          </p>
        </div>
      </div>
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
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
                  {['Name', 'Email', 'Roles', 'Reports To', 'Active', 'Actions'].map((h) => (
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
      </main>
      <Toast toasts={toasts} onRemove={removeToast} />
      {ConfirmModal}
    </div>
  );
}
