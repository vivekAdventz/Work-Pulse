import { useState, useMemo } from 'react';
import {
  IonButton, IonIcon, IonItem, IonInput, IonLabel, IonList,
  IonItemSliding, IonItemOptions, IonItemOption, IonText,
  IonSegment, IonSegmentButton,
} from '@ionic/react';
import api from '../services/api';

export default function ConfigPage({ user, fullDb, setFullDb }) {
  const [activeSection, setActiveSection] = useState('companies');

  const userCompanies = useMemo(() => fullDb.companies.filter((i) => i.createdBy === user.id), [fullDb.companies, user.id]);
  const userStakeholders = useMemo(() => fullDb.stakeholders.filter((i) => i.createdBy === user.id), [fullDb.stakeholders, user.id]);
  const userProjects = useMemo(() => fullDb.projects.filter((i) => i.createdBy === user.id), [fullDb.projects, user.id]);
  const userSubProjects = useMemo(() => fullDb.subProjects.filter((i) => i.createdBy === user.id), [fullDb.subProjects, user.id]);
  const userActivityTypes = useMemo(() => fullDb.activityTypes.filter((i) => i.createdBy === user.id), [fullDb.activityTypes, user.id]);
  const userTeamMembers = useMemo(() => fullDb.teamMembers.filter((i) => i.createdBy === user.id), [fullDb.teamMembers, user.id]);

  const handleAddItem = async (key, data) => {
    try {
      const newItem = await api.addItem(key, { ...data, createdBy: user.id });
      setFullDb((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
    } catch (error) {
      alert(`Failed to add: ${error.message}`);
    }
  };

  const handleDeleteItem = async (key, id) => {
    try {
      await api.deleteItem(key, id);
      setFullDb((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== id) }));
    } catch (error) {
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const handleUpdateItem = async (key, id, newName) => {
    try {
      const updatedItem = await api.updateItem(key, id, { name: newName });
      setFullDb((prev) => ({ ...prev, [key]: prev[key].map((item) => (item.id === id ? updatedItem : item)) }));
    } catch (error) {
      alert(`Failed to update: ${error.message}`);
    }
  };

  const sections = [
    { key: 'companies', label: 'Companies' },
    { key: 'stakeholders', label: 'Stakeholders' },
    { key: 'projects', label: 'Projects' },
    { key: 'subProjects', label: 'Sub-Projects' },
    { key: 'activityTypes', label: 'Activities' },
    { key: 'teamMembers', label: 'Team Members' },
  ];

  return (
    <div>
      <div style={{ overflowX: 'auto', padding: '8px 4px', display: 'flex', gap: 4 }}>
        {sections.map((s) => (
          <IonButton
            key={s.key}
            fill={activeSection === s.key ? 'solid' : 'outline'}
            size="small"
            onClick={() => setActiveSection(s.key)}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {s.label}
          </IonButton>
        ))}
      </div>

      {activeSection === 'companies' && (
        <SimpleConfigList items={userCompanies} itemKey="companies" label="Company" onAdd={handleAddItem} onDelete={handleDeleteItem} onUpdate={handleUpdateItem} />
      )}
      {activeSection === 'stakeholders' && (
        <SimpleConfigList items={userStakeholders} itemKey="stakeholders" label="Stakeholder" onAdd={handleAddItem} onDelete={handleDeleteItem} onUpdate={handleUpdateItem} />
      )}
      {activeSection === 'projects' && (
        <ProjectConfigList projects={userProjects} companies={userCompanies} stakeholders={userStakeholders} onAdd={handleAddItem} onDelete={handleDeleteItem} />
      )}
      {activeSection === 'subProjects' && (
        <SubProjectConfigList subProjects={userSubProjects} projects={userProjects} onAdd={handleAddItem} onDelete={handleDeleteItem} />
      )}
      {activeSection === 'activityTypes' && (
        <SimpleConfigList items={userActivityTypes} itemKey="activityTypes" label="Activity Type" onAdd={handleAddItem} onDelete={handleDeleteItem} onUpdate={handleUpdateItem} />
      )}
      {activeSection === 'teamMembers' && (
        <SimpleConfigList items={userTeamMembers} itemKey="teamMembers" label="Team Member" onAdd={handleAddItem} onDelete={handleDeleteItem} onUpdate={handleUpdateItem} />
      )}
    </div>
  );
}

function SimpleConfigList({ items, itemKey, label, onAdd, onDelete, onUpdate }) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(itemKey, { name: name.trim() });
      setName('');
    }
  };

  const handleUpdate = (id) => {
    if (editingName.trim()) {
      onUpdate(itemKey, id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <div className="ion-padding">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <IonInput
          fill="outline"
          placeholder={`New ${label}...`}
          value={name}
          onIonInput={(e) => setName(e.detail.value || '')}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1 }}
        />
        <IonButton onClick={handleAdd}>Add</IonButton>
      </div>
      {items.length === 0 ? (
        <IonText color="medium" className="ion-text-center"><p>No {label.toLowerCase()}s yet.</p></IonText>
      ) : (
        <IonList>
          {items.map((item) => (
            <IonItemSliding key={item.id}>
              <IonItem>
                {editingId === item.id ? (
                  <IonInput
                    value={editingName}
                    onIonInput={(e) => setEditingName(e.detail.value || '')}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item.id)}
                    autofocus
                  />
                ) : (
                  <IonLabel onClick={() => { setEditingId(item.id); setEditingName(item.name); }}>{item.name}</IonLabel>
                )}
                {editingId === item.id && (
                  <IonButton fill="clear" slot="end" size="small" onClick={() => handleUpdate(item.id)}>Save</IonButton>
                )}
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="primary" onClick={() => { setEditingId(item.id); setEditingName(item.name); }}>Edit</IonItemOption>
                <IonItemOption color="danger" onClick={() => onDelete(itemKey, item.id)}>Delete</IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>
      )}
    </div>
  );
}

function ProjectConfigList({ projects, companies, stakeholders, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [stakeholderId, setStakeholderId] = useState('');

  const handleAdd = () => {
    if (name.trim() && companyId && stakeholderId) {
      onAdd('projects', { name: name.trim(), companyId, stakeholderId });
      setName('');
      setCompanyId('');
      setStakeholderId('');
    }
  };

  return (
    <div className="ion-padding">
      <IonInput fill="outline" placeholder="Project Name..." value={name} onIonInput={(e) => setName(e.detail.value || '')} className="ion-margin-bottom" />
      <div style={{ marginBottom: 8 }}>
        <IonLabel style={{ fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>Company</IonLabel>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--ion-color-medium)', background: 'var(--ion-background-color)', marginTop: 4 }}
        >
          <option value="">Select Company</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <IonLabel style={{ fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>Stakeholder</IonLabel>
        <select
          value={stakeholderId}
          onChange={(e) => setStakeholderId(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--ion-color-medium)', background: 'var(--ion-background-color)', marginTop: 4 }}
        >
          <option value="">Select Stakeholder</option>
          {stakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <IonButton expand="block" onClick={handleAdd} className="ion-margin-bottom">Add Project</IonButton>
      {projects.length === 0 ? (
        <IonText color="medium" className="ion-text-center"><p>No projects yet.</p></IonText>
      ) : (
        <IonList>
          {projects.map((item) => (
            <IonItemSliding key={item.id}>
              <IonItem>
                <IonLabel>
                  <h2>{item.name}</h2>
                  <p>{companies.find((c) => c.id === item.companyId)?.name} / {stakeholders.find((s) => s.id === item.stakeholderId)?.name}</p>
                </IonLabel>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption color="danger" onClick={() => onDelete('projects', item.id)}>Delete</IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>
      )}
    </div>
  );
}

function SubProjectConfigList({ subProjects, projects, onAdd, onDelete }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [name, setName] = useState('');

  const filtered = useMemo(() => subProjects.filter((sp) => sp.projectId === selectedProject), [subProjects, selectedProject]);

  const handleAdd = () => {
    if (name.trim() && selectedProject) {
      onAdd('subProjects', { name: name.trim(), projectId: selectedProject });
      setName('');
    }
  };

  return (
    <div className="ion-padding">
      <div style={{ marginBottom: 8 }}>
        <IonLabel style={{ fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>Project</IonLabel>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--ion-color-medium)', background: 'var(--ion-background-color)', marginTop: 4 }}
        >
          <option value="">Select Project...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {selectedProject && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <IonInput fill="outline" placeholder="Sub-Project Name..." value={name} onIonInput={(e) => setName(e.detail.value || '')} style={{ flex: 1 }} />
            <IonButton onClick={handleAdd}>Add</IonButton>
          </div>
          {filtered.length === 0 ? (
            <IonText color="medium" className="ion-text-center"><p>No sub-projects yet.</p></IonText>
          ) : (
            <IonList>
              {filtered.map((item) => (
                <IonItemSliding key={item.id}>
                  <IonItem>
                    <IonLabel>{item.name}</IonLabel>
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption color="danger" onClick={() => onDelete('subProjects', item.id)}>Delete</IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonList>
          )}
        </>
      )}
    </div>
  );
}
