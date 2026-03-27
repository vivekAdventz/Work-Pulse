import { useState, useMemo } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonButtons, IonChip, IonLabel, IonItem, IonInput, IonRefresher, IonRefresherContent,
  IonText, IonFab, IonFabButton, IonMenu, IonList, IonMenuToggle, IonSplitPane,
  IonSegment, IonSegmentButton,
} from '@ionic/react';
import {
  add, playOutline, logOutOutline, settingsOutline, calendarOutline,
  homeOutline, menuOutline,
} from 'ionicons/icons';
import api from '../services/api';
import TimeEntryListComponent from '../components/TimeEntryList';
import TimeEntryFormModal from '../components/TimeEntryForm';
import TimerModal from '../components/TimerModal';
import ConfigPage from '../components/ConfigManager';

export default function EmployeeView({ user, fullDb, setFullDb, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dateFilter, setDateFilter] = useState('');
  const [formInitialData, setFormInitialData] = useState(null);

  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const handleSaveEntry = async (entryData) => {
    try {
      if (entryData.id) {
        const updatedEntry = await api.updateTimeEntry(entryData.id, entryData);
        setFullDb((prev) => ({ ...prev, timeEntries: prev.timeEntries.map((e) => (e.id === entryData.id ? updatedEntry : e)) }));
      } else {
        const newEntry = await api.addTimeEntry(entryData);
        setFullDb((prev) => ({ ...prev, timeEntries: [...prev.timeEntries, newEntry] }));
      }
    } catch (error) {
      alert(`Failed to save time entry: ${error.message}`);
    } finally {
      setIsFormOpen(false);
      setFormInitialData(null);
    }
  };

  const deleteTimeEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.deleteTimeEntry(id);
        setFullDb((prev) => ({ ...prev, timeEntries: prev.timeEntries.filter((e) => e.id !== id) }));
      } catch (error) {
        alert(`Failed to delete entry: ${error.message}`);
      }
    }
  };

  const handleStartTimer = () => {
    setTimerStartTime(getCurrentTime());
    setIsTimerOpen(true);
  };

  const handleStopTimer = () => {
    const endTime = getCurrentTime();
    setIsTimerOpen(false);
    setFormInitialData({ startTime: timerStartTime, endTime, date: new Date().toISOString().split('T')[0] });
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry) => {
    setFormInitialData(entry);
    setIsFormOpen(true);
  };

  const handleAddItem = (key, data) => async () => {
    // This is handled per-config component
  };

  const handleRefresh = async (event) => {
    try {
      const data = await api.getAllData();
      setFullDb(data);
    } catch { /* ignore */ }
    finally { event.detail.complete(); }
  };

  const userTimeEntries = useMemo(() => {
    let entries = fullDb.timeEntries.filter((e) => e.userId === user.id);
    if (dateFilter) entries = entries.filter((e) => e.date === dateFilter);
    return entries.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [fullDb.timeEntries, user.id, dateFilter]);

  const totalHours = useMemo(() => userTimeEntries.reduce((sum, e) => sum + e.hours, 0), [userTimeEntries]);

  const handleDownloadCsv = async () => {
    if (userTimeEntries.length === 0) {
      alert('No entries to download.');
      return;
    }
    const dataToExport = userTimeEntries.map((entry) => {
      const project = fullDb.projects.find((p) => p.id === entry.projectId);
      const company = fullDb.companies.find((c) => c.id === project?.companyId);
      return {
        Date: entry.date,
        StartTime: entry.startTime,
        EndTime: entry.endTime,
        Hours: entry.hours.toFixed(2),
        Company: company?.name || 'N/A',
        Project: project?.name || 'N/A',
        SubProject: fullDb.subProjects.find((sp) => sp.id === entry.subProjectId)?.name || 'N/A',
        Activity: fullDb.activityTypes.find((a) => a.id === entry.activityTypeId)?.name || 'N/A',
        Location: entry.workLocation,
        Priority: entry.priority,
        Description: entry.description,
      };
    });
    try {
      const blob = await api.downloadCsv(dataToExport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `timesheet_${user.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert(`Failed to download CSV: ${error.message}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Adventz Timesheet</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        {hasBothRoles && onToggleRole && (
          <IonToolbar>
            <IonSegment value={activeRole} onIonChange={(e) => onToggleRole(e.detail.value)}>
              <IonSegmentButton value="Employee">
                <IonLabel>Employee</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="Manager">
                <IonLabel>Manager</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        )}
        <IonToolbar>
          <IonSegment value={activeView} onIonChange={(e) => setActiveView(e.detail.value)}>
            <IonSegmentButton value="dashboard">
              <IonIcon icon={homeOutline} />
              <IonLabel>Dashboard</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="config">
              <IonIcon icon={settingsOutline} />
              <IonLabel>Configuration</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
        {activeView === 'dashboard' && (
          <IonToolbar>
            <IonItem lines="none">
              <IonIcon icon={calendarOutline} slot="start" color="medium" />
              <IonInput
                type="date"
                value={dateFilter}
                onIonInput={(e) => setDateFilter(e.detail.value || '')}
                placeholder="Filter by date"
              />
              {dateFilter && (
                <IonButton fill="clear" slot="end" onClick={() => setDateFilter('')} size="small">
                  Clear
                </IonButton>
              )}
            </IonItem>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 8px' }}>
              <IonChip color="primary">
                <IonLabel>{userTimeEntries.length} entries</IonLabel>
              </IonChip>
              <IonChip color="success">
                <IonLabel>{totalHours.toFixed(1)} hrs</IonLabel>
              </IonChip>
              <IonButton fill="outline" size="small" onClick={handleDownloadCsv}>
                CSV
              </IonButton>
            </div>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {activeView === 'dashboard' ? (
          <>
            {userTimeEntries.length === 0 ? (
              <div className="ion-text-center ion-padding" style={{ marginTop: '2rem' }}>
                <IonText color="medium">
                  <h2>No time entries found</h2>
                  <p>Tap + to add your first entry</p>
                </IonText>
              </div>
            ) : (
              <TimeEntryListComponent
                entries={userTimeEntries}
                allUsers={fullDb.users}
                fullDb={fullDb}
                onEdit={handleEditEntry}
                onDelete={deleteTimeEntry}
              />
            )}

            <div style={{ display: 'flex', gap: 12, position: 'fixed', bottom: 20, right: 16, zIndex: 100 }}>
              <IonFab>
                <IonFabButton color="success" onClick={handleStartTimer} size="small">
                  <IonIcon icon={playOutline} />
                </IonFabButton>
              </IonFab>
              <IonFab>
                <IonFabButton color="primary" onClick={() => { setFormInitialData(null); setIsFormOpen(true); }}>
                  <IonIcon icon={add} />
                </IonFabButton>
              </IonFab>
            </div>
          </>
        ) : (
          <ConfigPage user={user} fullDb={fullDb} setFullDb={setFullDb} />
        )}

        <TimerModal isOpen={isTimerOpen} onStop={handleStopTimer} />
        <TimeEntryFormModal
          isOpen={isFormOpen}
          userId={user.id}
          fullDb={fullDb}
          initialData={formInitialData}
          onSave={handleSaveEntry}
          onClose={() => { setIsFormOpen(false); setFormInitialData(null); }}
        />
      </IonContent>
    </IonPage>
  );
}
