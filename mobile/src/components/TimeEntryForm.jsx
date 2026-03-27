import { useState, useMemo } from 'react';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonNote, IonList,
} from '@ionic/react';

export default function TimeEntryFormModal({ isOpen, userId, fullDb, initialData, onSave, onClose }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [subProjectId, setSubProjectId] = useState('');
  const [activityTypeId, setActivityTypeId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [workLocation, setWorkLocation] = useState('Office');
  const [teamMemberIds, setTeamMemberIds] = useState([]);
  const [description, setDescription] = useState('');

  const isEditing = initialData && initialData.id;

  const handleDidPresent = () => {
    setDate(initialData?.date || new Date().toISOString().split('T')[0]);
    setStartTime(initialData?.startTime || '09:00');
    setEndTime(initialData?.endTime || '17:00');
    setProjectId(initialData?.projectId || '');
    setSubProjectId(initialData?.subProjectId || '');
    setActivityTypeId(initialData?.activityTypeId || '');
    setPriority(initialData?.priority || 'Medium');
    setWorkLocation(initialData?.workLocation || 'Office');
    setTeamMemberIds(initialData?.teamMemberIds || []);
    setDescription(initialData?.description || '');
  };

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  const userProjects = useMemo(() => fullDb.projects.filter((p) => p.createdBy === userId), [fullDb.projects, userId]);
  const userActivityTypes = useMemo(() => fullDb.activityTypes.filter((a) => a.createdBy === userId), [fullDb.activityTypes, userId]);
  const userTeamMembers = useMemo(() => fullDb.teamMembers.filter((t) => t.createdBy === userId), [fullDb.teamMembers, userId]);
  const availableSubProjects = useMemo(() => fullDb.subProjects.filter((sp) => sp.projectId === projectId && sp.createdBy === userId), [fullDb.subProjects, projectId, userId]);

  const selectedProject = userProjects.find((p) => p.id === projectId);
  const company = fullDb.companies.find((c) => c.id === selectedProject?.companyId);
  const stakeholder = fullDb.stakeholders.find((s) => s.id === selectedProject?.stakeholderId);

  const handleSubmit = () => {
    if (hours <= 0 || !activityTypeId) {
      alert('Please fill all required fields and ensure end time is after start time.');
      return;
    }
    onSave({
      id: isEditing ? initialData.id : undefined,
      userId,
      date,
      startTime,
      endTime,
      hours,
      projectId: projectId || undefined,
      subProjectId: subProjectId || undefined,
      activityTypeId,
      priority,
      workLocation,
      teamMemberIds,
      description,
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidPresent={handleDidPresent} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonTitle>{isEditing ? 'Edit' : 'New'} Entry</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSubmit}>Save</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonInput label="Date" labelPlacement="stacked" type="date" value={date} onIonInput={(e) => setDate(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonInput label="Start Time" labelPlacement="stacked" type="time" value={startTime} onIonInput={(e) => setStartTime(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonInput label="End Time" labelPlacement="stacked" type="time" value={endTime} onIonInput={(e) => setEndTime(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel>Hours</IonLabel>
            <IonNote slot="end" color="primary" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{hours.toFixed(2)}</IonNote>
          </IonItem>

          <IonItem>
            <IonSelect
              label="Project"
              labelPlacement="stacked"
              value={projectId}
              onIonChange={(e) => { setProjectId(e.detail.value); setSubProjectId(''); }}
              interface="action-sheet"
            >
              {userProjects.map((p) => (
                <IonSelectOption key={p.id} value={p.id}>{p.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonSelect
              label="Sub-Project"
              labelPlacement="stacked"
              value={subProjectId}
              onIonChange={(e) => setSubProjectId(e.detail.value)}
              disabled={!projectId}
              interface="action-sheet"
            >
              {availableSubProjects.map((sp) => (
                <IonSelectOption key={sp.id} value={sp.id}>{sp.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {company && (
            <IonItem>
              <IonLabel color="medium">Company</IonLabel>
              <IonNote slot="end">{company.name}</IonNote>
            </IonItem>
          )}
          {stakeholder && (
            <IonItem>
              <IonLabel color="medium">Stakeholder</IonLabel>
              <IonNote slot="end">{stakeholder.name}</IonNote>
            </IonItem>
          )}

          <IonItem>
            <IonSelect
              label="Activity Type"
              labelPlacement="stacked"
              value={activityTypeId}
              onIonChange={(e) => setActivityTypeId(e.detail.value)}
              interface="action-sheet"
            >
              {userActivityTypes.map((a) => (
                <IonSelectOption key={a.id} value={a.id}>{a.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonSelect
              label="Priority"
              labelPlacement="stacked"
              value={priority}
              onIonChange={(e) => setPriority(e.detail.value)}
              interface="action-sheet"
            >
              <IonSelectOption value="Low">Low</IonSelectOption>
              <IonSelectOption value="Medium">Medium</IonSelectOption>
              <IonSelectOption value="High">High</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonSelect
              label="Location"
              labelPlacement="stacked"
              value={workLocation}
              onIonChange={(e) => setWorkLocation(e.detail.value)}
              interface="action-sheet"
            >
              <IonSelectOption value="Office">Office</IonSelectOption>
              <IonSelectOption value="Client">Client</IonSelectOption>
              <IonSelectOption value="Home">Home</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonSelect
              label="Team Members"
              labelPlacement="stacked"
              value={teamMemberIds}
              onIonChange={(e) => setTeamMemberIds(e.detail.value)}
              multiple
              interface="alert"
            >
              {userTeamMembers.map((tm) => (
                <IonSelectOption key={tm.id} value={tm.id}>{tm.name}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonTextarea
              label="Description"
              labelPlacement="stacked"
              value={description}
              onIonInput={(e) => setDescription(e.detail.value || '')}
              rows={3}
              placeholder="Enter description..."
            />
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
}
