import { useState } from 'react';
import api from '../api';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';

export default function SuperadminView({ user, onLogout, allUsers, setUsers }) {
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
      } catch (error) {
        alert(`Failed to update user status: ${error.message}`);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (allUsers.some((u) => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== editingUser?.id)) {
      alert('A user with this email already exists.');
      return;
    }
    if (formData.roles.includes('Employee') && managers.length === 0) {
      alert('Cannot create an employee because no managers exist. Please create a manager first.');
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
      } else {
        const newUser = await api.createUser({ ...payload, active: true });
        setUsers([...allUsers, newUser]);
      }
      setIsFormOpen(false);
      setEditingUser(null);
    } catch (error) {
      alert(`Failed to save user: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-4 md:px-8">
        <h1 className="text-xl font-semibold text-slate-800">Superadmin</h1>
        <div className="flex items-center space-x-4">
          <span className="text-slate-600 text-sm">Welcome, {user.name}</span>
          <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg shadow-sm hover:bg-sky-600 transition-colors">Logout</button>
        </div>
      </header>
      <main className="p-4 md:p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-slate-700">User Administration</h2>
            <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 transition-transform hover:scale-105 w-full md:w-auto"><PlusIcon /> Add User</button>
          </div>

          {isFormOpen && (
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 mb-6 border border-slate-200 rounded-lg bg-slate-50">
              <div className="col-span-1"><input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500" required /></div>
              <div className="col-span-1"><input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500" required /></div>
              <div className="col-span-1">
                <div className="flex flex-col gap-2 p-2 border border-slate-300 rounded-md bg-white">
                  <label className="text-xs font-medium text-slate-500">Roles</label>
                  {['Employee', 'Manager'].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(r)}
                        onChange={(e) => {
                          const newRoles = e.target.checked
                            ? [...formData.roles, r]
                            : formData.roles.filter((x) => x !== r);
                          setFormData({ ...formData, roles: newRoles.length > 0 ? newRoles : [r] });
                        }}
                        className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              {formData.roles.includes('Employee') && (
                <div className="col-span-1">
                  <select value={formData.reportsTo} onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-sky-500" required>
                    <option value="">Select Manager...</option>
                    {managers.length > 0 ? managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>) : <option disabled>No managers available</option>}
                  </select>
                </div>
              )}
              <div className="col-span-full flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors">{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Email', 'Roles', 'Reports To', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {usersToShow.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.roles?.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.reportsTo ? allUsers.find((m) => m.id === u.reportsTo)?.name : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={u.active} onChange={() => handleToggleActive(u.id, u.active)} />
                          <div className={`block w-11 h-6 rounded-full transition-colors ${u.active ? 'bg-sky-500' : 'bg-slate-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${u.active ? 'translate-x-full' : ''}`}></div>
                        </div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                      <button onClick={() => handleEditClick(u)} className="text-slate-500 hover:text-sky-600 transition-colors"><EditIcon /></button>
                      <button className="text-slate-500 hover:text-red-600 transition-colors"><DeleteIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
