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
    includeWeekends: false,
    includeHome: false,
  };

  const [filters, setFilters] = useState(initialFilters);

  const managerProjects = useMemo(() => fullDb.projects.filter((p) => reportIds.includes(p.createdBy)), [fullDb.projects, reportIds]);

  const filteredProjects = useMemo(() => {
    if (filters.selectedEmployees.length === 0) return managerProjects;
    return managerProjects.filter((p) => filters.selectedEmployees.includes(p.createdBy));
  }, [managerProjects, filters.selectedEmployees]);

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
      setFilters((prev) => ({ ...prev, [key]: value, selectedProjects: [] }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    setFilters((prev) => ({ ...prev, selectedEmployees: [], selectedProjects: [] }));
  };

  const filteredEntries = useMemo(() => {
    let entries = allEntries.filter((entry) => relevantUserIds.includes(entry.userId));
    entries = entries.filter((e) => e.date >= filters.startDate && e.date <= filters.endDate);
    if (filters.selectedEmployees.length > 0) entries = entries.filter((e) => filters.selectedEmployees.includes(e.userId));
    if (filters.selectedProjects.length > 0) entries = entries.filter((e) => filters.selectedProjects.includes(e.projectId));
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
      <div className="space-y-6 animate-fadeIn">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manager Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Monitor team performance and project progress across levels.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateSummaryClick}
                disabled={isSummaryLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-100 hover:shadow-sky-200 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <SparklesIcon /> {isSummaryLoading ? 'Generating...' : 'AI Summary'}
              </button>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button onClick={() => setDashboardView('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${dashboardView === 'dashboard' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <ListIcon /> Dashboard
                </button>
                <button onClick={() => setDashboardView('calendar')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${dashboardView === 'calendar' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <CalendarIcon /> Calendar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Reporting Level */}
            {maxLevel > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => handleLevelChange(Number(e.target.value))}
                  className="w-full p-3 border-2 border-slate-100 rounded-xl bg-slate-50 text-sm font-medium focus:border-sky-500 focus:ring-0 transition-colors outline-none cursor-pointer"
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

            {/* Date Range */}
            <div className="space-y-2 lg:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 p-2.5 border-2 border-slate-100 rounded-xl bg-slate-50 text-sm font-medium focus:border-sky-500 transition-colors outline-none" />
                <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 p-2.5 border-2 border-slate-100 rounded-xl bg-slate-50 text-sm font-medium focus:border-sky-500 transition-colors outline-none" />
              </div>
            </div>

            {/* Employees Toggle List */}
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                Team Selection
                <span className="text-[10px] text-slate-400 font-normal normal-case">Scroll to see all</span>
              </label>
              <div className="flex flex-wrap gap-2 p-3 border-2 border-slate-100 rounded-xl bg-slate-50 max-h-32 overflow-y-auto custom-scrollbar">
                {visibleReportees.map((dr) => {
                  const isSelected = filters.selectedEmployees.includes(dr.id);
                  return (
                    <button
                      key={dr.id}
                      onClick={() => {
                        const newSelection = isSelected 
                          ? filters.selectedEmployees.filter(id => id !== dr.id)
                          : [...filters.selectedEmployees, dr.id];
                        handleFilterChange('selectedEmployees', newSelection);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        isSelected 
                        ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-100' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300'
                      }`}
                    >
                      {dr.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Projects Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                Projects
                {filters.selectedProjects.length > 0 && <button onClick={() => handleFilterChange('selectedProjects', [])} className="text-[10px] text-sky-600 font-bold lowercase hover:underline">Clear Selection</button>}
              </label>
              <div className="flex flex-wrap gap-2 p-3 border-2 border-slate-100 rounded-xl bg-slate-50 max-h-32 overflow-y-auto custom-scrollbar">
                {filteredProjects.map((p) => {
                  const isSelected = filters.selectedProjects.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        const newSelection = isSelected 
                          ? filters.selectedProjects.filter(id => id !== p.id)
                          : [...filters.selectedProjects, p.id];
                        handleFilterChange('selectedProjects', newSelection);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                        isSelected 
                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-100' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
                {filteredProjects.length === 0 && <span className="text-xs text-slate-400 italic py-1">No projects found for current team view</span>}
              </div>
            </div>
          </div>
        </div>

        {isSummaryModalOpen && (
          <div ref={modalRef} onClick={handleBackdropClick} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
                    <SparklesIcon />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Team AI Insights</h2>
                </div>
                <button onClick={() => setIsSummaryModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">&times;</button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {isSummaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-6 text-slate-500 font-medium animate-pulse">Analyzing team performance...</p>
                  </div>
                ) : summaryError ? (
                  <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl text-center">
                    <p className="text-red-800 font-bold mb-1">Analysis Interrupted</p>
                    <p className="text-red-600 text-sm">{summaryError}</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-800 line-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(summary) }}></div>
                )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={() => setIsSummaryModalOpen(false)} className="px-6 py-2 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Done</button>
              </div>
            </div>
          </div>
        )}

        {dashboardView === 'dashboard' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700">Project Distribution</h3>
                  {chartProjectFilter && <button onClick={() => setChartProjectFilter(null)} className="text-[10px] text-sky-600 font-bold uppercase hover:underline">Reset</button>}
                </div>
                <PieChart data={projectHours} onSliceClick={setChartProjectFilter} activeId={chartProjectFilter} />
              </div>
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-700 mb-6 font-bold">Team Hour Allocation</h3>
                <BarChart data={employeeHours} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700">Activity Overview</h3>
                  <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tighter">by Team</div>
                </div>
                <div className="flex-1">
                  <ProjectSummaryTable entries={filteredEntries} fullDb={fullDb} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700">Log Feed</h3>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                  </div>
                </div>
                <div className="flex-1 max-h-[450px] overflow-y-auto custom-scrollbar">
                  <TimeEntryList entries={filteredEntries} allUsers={allUsers} fullDb={fullDb} readOnly={true} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ManagerCalendarView entries={filteredEntries} fullDb={fullDb} directReports={visibleReportees} />
        )}
      </div>
    </MainLayout>
  );
}
