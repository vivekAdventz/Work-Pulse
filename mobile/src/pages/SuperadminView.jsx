import { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonButtons, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonList, IonText, IonToggle, IonModal, IonCheckbox,
} from '@ionic/react';
import { logOutOutline, addOutline, createOutline } from 'ionicons/icons';
import api from '../services/api';

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
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      roles: userToEdit.roles || ['Employee'],
      reportsTo: userToEdit.reportsTo || '',
    });
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

  const handleFormSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in name and email.');
      return;
    }
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

  const handleRoleToggle = (role, checked) => {
    const newRoles = checked
      ? [...formData.roles, role]
      : formData.roles.filter((r) => r !== role);
    setFormData({ ...formData, roles: newRoles.length > 0 ? newRoles : [role] });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Superadmin</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>User Administration</h2>
            <IonButton size="small" onClick={handleAddClick}>
              <IonIcon slot="start" icon={addOutline} />
              Add User
            </IonButton>
          </div>

          <IonText color="medium" style={{ fontSize: '0.8rem', display: 'block', marginBottom: 8 }}>
            Welcome, {user.name}
          </IonText>

          {/* User Form Modal */}
          <IonModal isOpen={isFormOpen} onDidDismiss={() => setIsFormOpen(false)}>
            <IonHeader>
              <IonToolbar color="primary">
                <IonButtons slot="start">
                  <IonButton onClick={() => setIsFormOpen(false)}>Cancel</IonButton>
                </IonButtons>
                <IonTitle>{editingUser ? 'Edit User' : 'Add User'}</IonTitle>
                <IonButtons slot="end">
                  <IonButton strong onClick={handleFormSubmit}>Save</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonList>
                <IonItem>
                  <IonInput
                    label="Name"
                    labelPlacement="stacked"
                    placeholder="Enter name"
                    value={formData.name}
                    onIonInput={(e) => setFormData({ ...formData, name: e.detail.value || '' })}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Email"
                    labelPlacement="stacked"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onIonInput={(e) => setFormData({ ...formData, email: e.detail.value || '' })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Roles</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox
                    checked={formData.roles.includes('Employee')}
                    onIonChange={(e) => handleRoleToggle('Employee', e.detail.checked)}
                  >
                    Employee
                  </IonCheckbox>
                </IonItem>
                <IonItem>
                  <IonCheckbox
                    checked={formData.roles.includes('Manager')}
                    onIonChange={(e) => handleRoleToggle('Manager', e.detail.checked)}
                  >
                    Manager
                  </IonCheckbox>
                </IonItem>
                {formData.roles.includes('Employee') && (
                  <IonItem>
                    <IonSelect
                      label="Reports To"
                      labelPlacement="stacked"
                      value={formData.reportsTo}
                      onIonChange={(e) => setFormData({ ...formData, reportsTo: e.detail.value })}
                      interface="action-sheet"
                    >
                      {managers.map((m) => (
                        <IonSelectOption key={m.id} value={m.id}>{m.name}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                )}
              </IonList>
            </IonContent>
          </IonModal>

          {/* User List */}
          {usersToShow.length === 0 ? (
            <div className="ion-text-center" style={{ marginTop: '2rem' }}>
              <IonText color="medium">
                <p>No users found. Add a user to get started.</p>
              </IonText>
            </div>
          ) : (
            <IonList>
              {usersToShow.map((u) => (
                <IonItem key={u.id}>
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{u.name}</h2>
                    <p>{u.email}</p>
                    <p style={{ fontSize: '0.8rem' }}>
                      Roles: {u.roles?.join(', ')} 
                      {u.reportsTo ? ` | Reports to: ${allUsers.find((m) => m.id === u.reportsTo)?.name || 'N/A'}` : ''}
                    </p>
                  </IonLabel>
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IonToggle
                      checked={u.active}
                      onIonChange={() => handleToggleActive(u.id, u.active)}
                      style={{ paddingRight: 8 }}
                    />
                    <IonButton fill="clear" size="small" onClick={() => handleEditClick(u)}>
                      <IonIcon slot="icon-only" icon={createOutline} />
                    </IonButton>
                  </div>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
