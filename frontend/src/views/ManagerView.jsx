import { useState, useMemo, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import api from '../api';
import MainLayout from '../components/layout/MainLayout';
import TimeEntryList from '../components/timeentry/TimeEntryList';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import ProjectSummaryTable from '../components/charts/ProjectSummaryTable';
import ManagerCalendarView from './ManagerCalendarView';
import { SparklesIcon, ListIcon, CalendarIcon } from '../components/common/Icons';
import TaskKeepView from '../components/taskkeep/TaskKeepView';
import TimeEntryForm from '../components/timeentry/TimeEntryForm';
import Toast, { useToast } from '../components/common/Toast';
import ReportModal from '../components/modals/ReportModal';

export default function ManagerView({ user, fullDb, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const { toasts, showToast, removeToast } = useToast();
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
  const [activeView, setActiveView] = useState('dashboard');

  // TaskKeep TimeEntryForm state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);

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

  const managerProjects = useMemo(() => fullDb.projects.filter((p) => relevantUserIds.includes(p.createdBy)), [fullDb.projects, relevantUserIds]);

  const filteredProjects = useMemo(() => {
    if (filters.selectedEmployees.length === 0) return managerProjects;
    return managerProjects.filter((p) => filters.selectedEmployees.includes(p.createdBy));
  }, [managerProjects, filters.selectedEmployees]);

  const [chartProjectFilter, setChartProjectFilter] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

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
      const result = await api.generateSummary(filteredEntries, fullDb, 'manager');
      setSummary(result.summary);
    } catch (error) {
      setSummaryError(error.message || 'An unknown error occurred.');
      setSummary('');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (filteredEntries.length === 0) {
      showToast('No entries to download', 'error');
      return;
    }
    try {
      const data = filteredEntries.map(e => ({
        Date: new Date(e.date).toLocaleDateString(),
        Employee: fullDb.users.find(u => u.id === e.userId)?.name || 'Unknown',
        Project: fullDb.projects.find(p => p.id === e.projectId)?.name || 'Unknown',
        'Sub-Project': fullDb.subProjects.find(sp => sp.id === e.subProjectId)?.name || 'N/A',
        Activity: fullDb.activityTypes.find(a => a.id === e.activityTypeId)?.name || 'Unknown',
        Hours: e.hours,
        Location: e.workLocation,
        Billable: e.billable ? 'Yes' : 'No',
        Description: (e.notes || '').replace(/\n/g, ' ')
      }));
      const blob = await api.downloadCsv(data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manager_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Report downloaded successfully', 'success');
    } catch (error) {
      showToast('Error downloading report: ' + error.message, 'error');
    }
  };

  const handleSaveEntry = async (entryData) => {
    try {
      await api.addTimeEntry(entryData);
      // If this came from TaskKeep done flow, finalize the done status
      if (formInitialData?._taskKeepDayId && formInitialData?._taskKeepTaskId) {
        try {
          await api.updateTaskInDay(formInitialData._taskKeepDayId, formInitialData._taskKeepTaskId, { status: 'done' });
          formInitialData._refreshTaskKeep?.();
        } catch (e) { console.error('Failed to finalize task status:', e); }
      }
      setIsFormOpen(false);
      setFormInitialData(null);
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };

  return (
    <>
    <MainLayout user={user} onLogout={onLogout} activeView={activeView} onNavigate={setActiveView} hasBothRoles={hasBothRoles} activeRole={activeRole} onToggleRole={onToggleRole}>
      {activeView === 'taskkeep' ? (
        <>
          <TaskKeepView
            user={user}
            fullDb={fullDb}
            setFullDb={() => {}}
            isManager={true}
            showToast={showToast}
            onOpenTimeEntryForm={(prefill) => {
              setFormInitialData(prefill);
              setIsFormOpen(true);
            }}
          />
          {isFormOpen && (
            <TimeEntryForm
              userId={user.id}
              onSaveEntry={handleSaveEntry}
              onClose={() => { setIsFormOpen(false); setFormInitialData(null); }}
              fullDb={fullDb}
              initialData={formInitialData}
            />
          )}
        </>
      ) : (
      <div className="space-y-4 animate-fadeIn">
        {/* Top row: Header/Filters + Project Distribution side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Header + Filters */}
          <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Manager Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Monitor team performance and project progress across levels.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSummaryClick}
                disabled={isSummaryLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-blue rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-mid transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <SparklesIcon /> {isSummaryLoading ? 'Generating...' : 'AI Summary'}
              </button>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button onClick={() => setDashboardView('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${dashboardView === 'dashboard' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <ListIcon /> Dashboard
                </button>
                <button onClick={() => setDashboardView('report')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${dashboardView === 'report' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Report
                </button>
                <button onClick={() => setDashboardView('calendar')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${dashboardView === 'calendar' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  <CalendarIcon /> Calendar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
            {/* Row 1: Level + Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {maxLevel > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporting Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm cursor-pointer"
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium focus:border-sky-400 transition-colors outline-none shadow-sm" />
                  <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-medium focus:border-sky-400 transition-colors outline-none shadow-sm" />
                </div>
              </div>
            </div>

            {/* Row 2: Team + Projects side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  Team Selection
                  {filters.selectedEmployees.length > 0 && <button onClick={() => handleFilterChange('selectedEmployees', [])} className="text-[10px] text-sky-500 font-bold normal-case hover:text-sky-700 transition-colors">Clear</button>}
                </label>
                <select
                  multiple
                  value={filters.selectedEmployees}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    handleFilterChange('selectedEmployees', selected);
                  }}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-medium focus:border-sky-400 focus:ring-0 outline-none cursor-pointer h-[72px] shadow-sm"
                >
                  {visibleReportees.map((dr) => (
                    <option key={dr.id} value={dr.id}>{dr.name}</option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-300 font-medium">Hold Ctrl/Cmd to select multiple</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                  Projects
                  {filters.selectedProjects.length > 0 && <button onClick={() => handleFilterChange('selectedProjects', [])} className="text-[10px] text-sky-500 font-bold normal-case hover:text-sky-700 transition-colors">Clear</button>}
                </label>
                <select
                  multiple
                  value={filters.selectedProjects}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                    handleFilterChange('selectedProjects', selected);
                  }}
                  className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-medium focus:border-sky-400 focus:ring-0 outline-none cursor-pointer h-[72px] shadow-sm"
                >
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {filteredProjects.length === 0 && <span className="text-[10px] text-slate-400 italic">No projects for current view</span>}
                <span className="text-[9px] text-slate-300 font-medium">Hold Ctrl/Cmd to select multiple</span>
              </div>
            </div>
          </div>
        </div>

          {/* Project Distribution — right side of header */}
          <div className="lg:col-span-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-700">Project Distribution</h3>
              {chartProjectFilter && <button onClick={() => setChartProjectFilter(null)} className="text-[10px] text-sky-600 font-bold uppercase hover:underline">Reset</button>}
            </div>
            <div className="flex-1 min-h-0">
              <PieChart data={projectHours} onSliceClick={setChartProjectFilter} activeId={chartProjectFilter} />
            </div>
          </div>
        </div>

        {isSummaryModalOpen && (
          <ReportModal
            reportData={summaryError ? `**Error:** ${summaryError}` : summary}
            isGenerating={isSummaryLoading}
            onClose={() => setIsSummaryModalOpen(false)}
          />
        )}

        {dashboardView === 'dashboard' ? (
          <div className="space-y-4">
            {/* Team Hour Allocation + Activity Overview — same row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Team Hour Allocation</h3>
                <BarChart data={employeeHours} />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Activity Overview</h3>
                  <div className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-tighter">by Team</div>
                </div>
                <ProjectSummaryTable entries={filteredEntries} fullDb={fullDb} />
              </div>
            </div>

            {/* Log Feed — full width at bottom */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 pb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-700">Log Feed</h3>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <TimeEntryList entries={filteredEntries} allUsers={allUsers} fullDb={fullDb} readOnly={true} />
              </div>
            </div>
          </div>
        ) : dashboardView === 'report' ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Detailed Report</h3>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download CSV
              </button>
            </div>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No entries found for the selected filters.</div>
            ) : (
              <div className="overflow-x-auto ring-1 ring-slate-200 rounded-xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Sub-Project</th>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3">Hours</th>
                      <th className="px-4 py-3 max-w-xs">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEntries.map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">{fullDb.users.find(u => u.id === e.userId)?.name || 'Unknown'}</td>
                        <td className="px-4 py-2">{fullDb.projects.find(p => p.id === e.projectId)?.name || 'Unknown'}</td>
                        <td className="px-4 py-2 text-slate-500">{fullDb.subProjects.find(sp => sp.id === e.subProjectId)?.name || '-'}</td>
                        <td className="px-4 py-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">
                            {fullDb.activityTypes.find(a => a.id === e.activityTypeId)?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-bold text-sky-600">{e.hours}h</td>
                        <td className="px-4 py-2 max-w-xs truncate text-xs text-slate-500" title={e.notes}>
                          {e.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <ManagerCalendarView entries={filteredEntries} fullDb={fullDb} directReports={visibleReportees} />
        )}
      </div>
      )}
    </MainLayout>
    <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}
