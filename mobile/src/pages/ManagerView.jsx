import { useState, useMemo, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonButtons, IonLabel, IonItem, IonSelect, IonSelectOption, IonText,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
  IonModal, IonSpinner, IonChip,
} from '@ionic/react';
import { logOutOutline, sparklesOutline, listOutline, calendarOutline } from 'ionicons/icons';
import api from '../services/api';
import TimeEntryListComponent from '../components/TimeEntryList';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import ProjectSummaryTable from '../components/ProjectSummaryTable';
import ManagerCalendarView from '../components/ManagerCalendarView';

export default function ManagerView({ user, fullDb, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const { users: allUsers, timeEntries: allEntries } = fullDb;
  const directReports = useMemo(() => allUsers.filter((u) => u.reportsTo === user.id), [allUsers, user.id]);
  const reportIds = useMemo(() => directReports.map((r) => r.id), [directReports]);
  const relevantUserIds = useMemo(() => [user.id, ...reportIds], [user.id, reportIds]);
  const [dashboardView, setDashboardView] = useState('dashboard');

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultEndDate.getDate() - 7);

  const [filters, setFilters] = useState({
    startDate: defaultStartDate.toISOString().split('T')[0],
    endDate: defaultEndDate.toISOString().split('T')[0],
    selectedEmployees: [],
    selectedProjects: [],
    selectedActivities: [],
    includeWeekends: false,
    includeHome: false,
  });

  const managerProjects = useMemo(() => fullDb.projects.filter((p) => reportIds.includes(p.createdBy)), [fullDb.projects, reportIds]);
  const managerActivityTypes = useMemo(() => fullDb.activityTypes.filter((a) => reportIds.includes(a.createdBy)), [fullDb.activityTypes, reportIds]);

  const filteredProjects = useMemo(() => {
    if (filters.selectedEmployees.length === 0) return managerProjects;
    return managerProjects.filter((p) => filters.selectedEmployees.includes(p.createdBy));
  }, [managerProjects, filters.selectedEmployees]);

  const filteredActivityTypes = useMemo(() => {
    if (filters.selectedEmployees.length === 0) return managerActivityTypes;
    return managerActivityTypes.filter((a) => filters.selectedEmployees.includes(a.createdBy));
  }, [managerActivityTypes, filters.selectedEmployees]);

  const [chartProjectFilter, setChartProjectFilter] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    if (key === 'startDate' && value > filters.endDate) {
      setFilters((prev) => ({ ...prev, startDate: value, endDate: value }));
    } else if (key === 'selectedEmployees') {
      setFilters((prev) => ({ ...prev, [key]: value, selectedProjects: [], selectedActivities: [] }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const filteredEntries = useMemo(() => {
    let entries = allEntries.filter((entry) => relevantUserIds.includes(entry.userId));
    entries = entries.filter((e) => e.date >= filters.startDate && e.date <= filters.endDate);
    if (filters.selectedEmployees.length > 0) entries = entries.filter((e) => filters.selectedEmployees.includes(e.userId));
    if (filters.selectedProjects.length > 0) entries = entries.filter((e) => filters.selectedProjects.includes(e.projectId));
    if (filters.selectedActivities.length > 0) entries = entries.filter((e) => filters.selectedActivities.includes(e.activityTypeId));
    if (!filters.includeWeekends) {
      entries = entries.filter((e) => {
        const day = new Date(e.date).getUTCDay();
        return day !== 6 && day !== 0;
      });
    }
    if (filters.includeHome) entries = entries.filter((e) => e.workLocation === 'Home');
    if (chartProjectFilter) entries = entries.filter((e) => e.projectId === chartProjectFilter);
    return entries.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [allEntries, relevantUserIds, filters, chartProjectFilter]);

  const projectHours = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => map.set(e.projectId, (map.get(e.projectId) || 0) + e.hours));
    return Array.from(map.entries()).map(([id, value]) => ({
      id,
      label: fullDb.projects.find((p) => p.id === id)?.name || 'Unknown',
      value,
    })).sort((a, b) => b.value - a.value);
  }, [filteredEntries, fullDb.projects]);

  const employeeHours = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((e) => map.set(e.userId, (map.get(e.userId) || 0) + e.hours));
    return Array.from(map.entries()).map(([id, value]) => ({
      label: fullDb.users.find((u) => u.id === id)?.name || 'Unknown',
      value,
    }));
  }, [filteredEntries, fullDb.users]);

  const totalHours = useMemo(() => filteredEntries.reduce((sum, e) => sum + e.hours, 0), [filteredEntries]);

  const handleGenerateSummary = async () => {
    setIsSummaryModalOpen(true);
    setIsSummaryLoading(true);
    setSummaryError('');
    try {
      const result = await api.generateSummary(filteredEntries, fullDb);
      setSummary(result.summary);
    } catch (error) {
      setSummaryError(error.message || 'An unknown error occurred.');
      setSummary('');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manager Dashboard</IonTitle>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <IonSegment value={dashboardView} onIonChange={(e) => setDashboardView(e.detail.value)} style={{ flex: 1 }}>
              <IonSegmentButton value="dashboard">
                <IonIcon icon={listOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="calendar">
                <IonIcon icon={calendarOutline} />
                <IonLabel>Calendar</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={async (event) => { event.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <IonButton size="small" onClick={handleGenerateSummary} disabled={isSummaryLoading}>
            <IonIcon slot="start" icon={sparklesOutline} />
            {isSummaryLoading ? 'Generating...' : 'AI Summary'}
          </IonButton>
          <IonButton size="small" fill="outline" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Filters'}
          </IonButton>
          <IonChip color="primary">
            <IonLabel>{filteredEntries.length} entries</IonLabel>
          </IonChip>
          <IonChip color="success">
            <IonLabel>{totalHours.toFixed(1)} hrs</IonLabel>
          </IonChip>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ padding: '0 16px 16px', background: 'var(--ion-color-light)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--ion-color-medium)', background: 'white' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--ion-color-medium)', background: 'white' }}
                />
              </div>
            </div>
            <IonItem>
              <IonSelect
                label="Employees"
                labelPlacement="stacked"
                value={filters.selectedEmployees}
                onIonChange={(e) => handleFilterChange('selectedEmployees', e.detail.value || [])}
                multiple
                interface="alert"
              >
                {directReports.map((dr) => (
                  <IonSelectOption key={dr.id} value={dr.id}>{dr.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect
                label="Projects"
                labelPlacement="stacked"
                value={filters.selectedProjects}
                onIonChange={(e) => handleFilterChange('selectedProjects', e.detail.value || [])}
                multiple
                interface="alert"
              >
                {filteredProjects.map((p) => (
                  <IonSelectOption key={p.id} value={p.id}>{p.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonSelect
                label="Activity Types"
                labelPlacement="stacked"
                value={filters.selectedActivities}
                onIonChange={(e) => handleFilterChange('selectedActivities', e.detail.value || [])}
                multiple
                interface="alert"
              >
                {filteredActivityTypes.map((a) => (
                  <IonSelectOption key={a.id} value={a.id}>{a.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                <input type="checkbox" checked={filters.includeWeekends} onChange={(e) => handleFilterChange('includeWeekends', e.target.checked)} />
                Weekends
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                <input type="checkbox" checked={filters.includeHome} onChange={(e) => handleFilterChange('includeHome', e.target.checked)} />
                Home Only
              </label>
            </div>
          </div>
        )}

        {/* AI Summary Modal */}
        <IonModal isOpen={isSummaryModalOpen} onDidDismiss={() => setIsSummaryModalOpen(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>AI-Generated Summary</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setIsSummaryModalOpen(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {isSummaryLoading ? (
              <div className="ion-text-center" style={{ marginTop: '2rem' }}>
                <IonSpinner name="crescent" />
                <p>Generating summary...</p>
              </div>
            ) : summaryError ? (
              <div style={{ padding: 16, background: 'var(--ion-color-danger-tint)', borderRadius: 8 }}>
                <IonText color="danger">
                  <p><strong>Error</strong></p>
                  <p>{summaryError}</p>
                </IonText>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: summary }} style={{ lineHeight: 1.6 }} />
            )}
          </IonContent>
        </IonModal>

        {dashboardView === 'dashboard' ? (
          <div style={{ padding: 16 }}>
            {/* Charts */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--ion-color-dark)' }}>Total Hours by Project</h3>
              <PieChart data={projectHours} onSliceClick={setChartProjectFilter} activeId={chartProjectFilter} />
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--ion-color-dark)' }}>Hours by Employee</h3>
              <BarChart data={employeeHours} />
            </div>

            {/* Project Summary */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--ion-color-dark)' }}>Project Summary</h3>
              <ProjectSummaryTable entries={filteredEntries} fullDb={fullDb} />
            </div>

            {/* Detailed Entries */}
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--ion-color-dark)' }}>Detailed Entries</h3>
              <TimeEntryListComponent
                entries={filteredEntries}
                allUsers={allUsers}
                fullDb={fullDb}
                readOnly={true}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <ManagerCalendarView entries={filteredEntries} fullDb={fullDb} directReports={directReports} />
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '8px 16px 24px', color: 'var(--ion-color-medium)', fontSize: '0.8rem' }}>
          Welcome, {user.name} ({activeRole || user.roles?.join(', ')})
        </div>
      </IonContent>
    </IonPage>
  );
}
