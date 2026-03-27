import {
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOptions, IonItemOption,
  IonBadge, IonNote, IonText,
} from '@ionic/react';

export default function TimeEntryListComponent({ entries, allUsers = [], fullDb, onEdit, onDelete, readOnly = false }) {
  const projectMap = new Map(fullDb.projects.map((p) => [p.id, p.name]));
  const subProjectMap = new Map(fullDb.subProjects.map((sp) => [sp.id, sp.name]));
  const activityMap = new Map(fullDb.activityTypes.map((a) => [a.id, a.name]));
  const userMap = new Map((allUsers || []).map((u) => [u.id, u.name]));

  if (entries.length === 0) {
    return (
      <div className="ion-text-center ion-padding">
        <IonText color="medium">
          <p>No time entries found</p>
        </IonText>
      </div>
    );
  }

  return (
    <IonList>
      {entries.map((entry) => (
        <IonItemSliding key={entry.id} disabled={readOnly}>
          <IonItem button={!readOnly} onClick={() => !readOnly && onEdit && onEdit(entry)} detail={!readOnly}>
            <IonLabel>
              <h2 style={{ fontWeight: 600 }}>
                {projectMap.get(entry.projectId) || 'Unknown Project'}
              </h2>
              {readOnly && userMap.get(entry.userId) && (
                <p style={{ fontWeight: 500, color: 'var(--ion-color-primary)' }}>{userMap.get(entry.userId)}</p>
              )}
              <p>{subProjectMap.get(entry.subProjectId) || ''} &middot; {activityMap.get(entry.activityTypeId) || ''}</p>
              <IonNote style={{ fontSize: '0.8rem' }}>
                {entry.date} &middot; {entry.startTime} - {entry.endTime} &middot; {entry.workLocation}
              </IonNote>
              {entry.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)', marginTop: 4 }}>
                  {entry.description.length > 60 ? entry.description.slice(0, 60) + '...' : entry.description}
                </p>
              )}
            </IonLabel>
            <div slot="end" style={{ textAlign: 'right' }}>
              <IonBadge color="primary">{entry.hours.toFixed(1)}h</IonBadge>
              <br />
              <IonNote style={{ fontSize: '0.7rem' }}>{entry.priority}</IonNote>
            </div>
          </IonItem>
          {!readOnly && (
            <IonItemOptions side="end">
              <IonItemOption color="primary" onClick={() => onEdit(entry)}>Edit</IonItemOption>
              <IonItemOption color="danger" onClick={() => onDelete(entry.id)}>Delete</IonItemOption>
            </IonItemOptions>
          )}
        </IonItemSliding>
      ))}
    </IonList>
  );
}
