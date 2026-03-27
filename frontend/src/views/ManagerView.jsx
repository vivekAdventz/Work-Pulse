import { useState, useMemo, useRef } from 'react';
import { marked } from 'marked';
import api from '../api';
import MainLayout from '../components/MainLayout';
import TimeEntryList from '../components/TimeEntryList';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import ProjectSummaryTable from '../components/ProjectSummaryTable';
import ManagerCalendarView from './ManagerCalendarView';
import { SparklesIcon, ListIcon, CalendarIcon } from '../components/Icons';

export default function ManagerView({ user, fullDb, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const { users: allUsers, timeEntries: allEntries } = fullDb;

  // Compute hierarchy levels: level 1 = direct reports, level 2 = their reports, etc.
  const reporteesByLevel = useMemo(() => {
    const levels = {};
    let currentParentIds = [user.id];
    let level = 1;
    const visited = new Set([user.id]);
    while (level <= 10) {
      const levelUsers = allUsers.filter(
        (u) => currentParentIds.includes(u.reportsTo) && !visited.has(u.id)
      );
      if (levelUsers.length === 0) break;
      levels[level] = levelUsers;
      levelUsers.forEach((u) => visited.add(u.id));
      currentParentIds = levelUsers.map((r) => r.id);
      level++;
    }
    return levels;
  }, [allUsers, user.id]);

  const maxLevel = useMemo(() => Object.keys(reporteesByLevel).length, [reporteesByLevel]);
  const [selectedLevel, setSelectedLevel] = useState(0); // 0 = all levels

  // Visible reportees based on selected level
  const visibleReportees = useMemo(() => {
    if (selectedLevel === 0) return Object.values(reporteesByLevel).flat();
    return reporteesByLevel[selectedLevel] || [];
  }, [reporteesByLevel, selectedLevel]);

  const directReports = useMemo(() => reporteesByLevel[1] || [], [reporteesByLevel]);
  const reportIds = useMemo(() => visibleReportees.map((r) => r.id), [visibleReportees]);
  const relevantUserIds = useMemo(() => [user.id, ...reportIds], [user.id, reportIds]);
  const [dashboardView, setDashboardView] = useState('dashboard');

  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultEndDate.getDate() - 7);

  const initialFilters = {
    startDate: defaultStartDate.toISOString().split('T')[0],
    endDate: defaultEndDate.toISOString().split('T')[0],
    selectedEmployees: [],
    selectedProjects: [],
    selectedActivities: [],
    includeWeekends: false,
    includeHome: false,
  };

  const [filters, setFilters] = useState(initialFilters);

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
  const modalRef = useRef();

  const handleFilterChange = (key, value) => {
    if (key === 'startDate' && value > filters.endDate) {
      setFilters((prev) => ({ ...prev, startDate: value, endDate: value }));
    } else if (key === 'selectedEmployees') {
      setFilters((prev) => ({ ...prev, [key]: value, selectedProjects: [], selectedActivities: [] }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setFilters((prev) => ({ ...prev, selectedEmployees: [], selectedProjects: [], selectedActivities: [] }));
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

  const handleGenerateSummaryClick = async () => {
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

  const handleBackdropClick = (e) => {
    if (modalRef.current === e.target) setIsSummaryModalOpen(false);
  };

  return (
    <MainLayout user={user} onLogout={onLogout} hasBothRoles={hasBothRoles} activeRole={activeRole} onToggleRole={onToggleRole}>
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-4 mb-4 gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleGenerateSummaryClick}
              disabled={isSummaryLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 transition-transform hover:scale-105 disabled:bg-sky-300 disabled:cursor-not-allowed"
            >
              <SparklesIcon /> {isSummaryLoading ? 'Generating...' : 'Generate AI Summary'}
            </button>
            <div className="flex items-center rounded-lg bg-slate-100 p-1">
              <button onClick={() => setDashboardView('dashboard')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${dashboardView === 'dashboard' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><ListIcon /> Dashboard</button>
              <button onClick={() => setDashboardView('calendar')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${dashboardView === 'calendar' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}><CalendarIcon /> Calendar</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          {maxLevel > 1 && (
            <div>
              <label className="font-medium text-slate-600">Reporting Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"
              >
                <option value={0}>All Levels</option>
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl} ({(reporteesByLevel[lvl] || []).length} {(reporteesByLevel[lvl] || []).length === 1 ? 'person' : 'people'})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="font-medium text-slate-600">Date Range</label>
            <div className="flex gap-2 mt-1">
              <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white" />
              <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white" />
            </div>
          </div>
          <div>
            <label className="font-medium text-slate-600">Employees</label>
            <select multiple value={filters.selectedEmployees} onChange={(e) => handleFilterChange('selectedEmployees', Array.from(e.target.selectedOptions, (o) => o.value))} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white h-20">
              {visibleReportees.map((dr) => <option key={dr.id} value={dr.id}>{dr.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-600">Projects</label>
            <select multiple value={filters.selectedProjects} onChange={(e) => handleFilterChange('selectedProjects', Array.from(e.target.selectedOptions, (o) => o.value))} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white h-20">
              {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-medium text-slate-600">Activity Types</label>
            <select multiple value={filters.selectedActivities} onChange={(e) => handleFilterChange('selectedActivities', Array.from(e.target.selectedOptions, (o) => o.value))} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white h-20">
              {filteredActivityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isSummaryModalOpen && (
        <div ref={modalRef} onClick={handleBackdropClick} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">AI-Generated Summary</h2>
              <button onClick={() => setIsSummaryModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {isSummaryLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Generating summary...</p>
                </div>
              ) : summaryError ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  <p className="font-semibold">Error</p>
                  <p>{summaryError}</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}></div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setIsSummaryModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {dashboardView === 'dashboard' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Total Hours by Project</h3>
              <PieChart data={projectHours} onSliceClick={setChartProjectFilter} activeId={chartProjectFilter} />
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Hours by Employee</h3>
              <BarChart data={employeeHours} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Project Summary</h3>
              <ProjectSummaryTable entries={filteredEntries} fullDb={fullDb} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Detailed Entries</h3>
              <div className="max-h-[400px] overflow-y-auto">
                <TimeEntryList entries={filteredEntries} allUsers={allUsers} fullDb={fullDb} readOnly={true} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <ManagerCalendarView entries={filteredEntries} fullDb={fullDb} directReports={visibleReportees} />
      )}
    </MainLayout>
  );
}
