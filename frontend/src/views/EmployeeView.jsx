import { useState, useMemo, useEffect, useCallback } from 'react';
import api from '../api';
import MainLayout from '../components/layout/MainLayout';
import TimeEntryList from '../components/timeentry/TimeEntryList';
import EmployeeCalendarView from './EmployeeCalendarView';
import TimeEntryForm from '../components/timeentry/TimeEntryForm';
import TimerModal from '../components/modals/TimerModal';
import ReportModal from '../components/modals/ReportModal';
import ConfigManager from '../components/config/ConfigManager';
import SubProjectConfig from '../components/config/SubProjectConfig';
import ProjectConfig from '../components/config/ProjectConfig';
import AiFillModal from '../components/modals/AiFillModal';
import Toast, { useToast } from '../components/common/Toast';
import { PlusIcon, PlayIcon, CalendarIcon, TableIcon, AiWandIcon } from '../components/common/Icons';
import TaskKeepView from '../components/taskkeep/TaskKeepView';

export default function EmployeeView({ user, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const { toasts, showToast, removeToast } = useToast();
  
  // Local Data States
  const [users, setUsers] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [subProjects, setSubProjects] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState('table');
  
  // Filter States
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [stakeholderFilter, setStakeholderFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formInitialData, setFormInitialData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isAiFillOpen, setIsAiFillOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const db = await api.getAllData();
      setUsers(db.users || []);
      setTimeEntries(db.timeEntries || []);
      setCompanies(db.companies || []);
      setStakeholders(db.stakeholders || []);
      setProjects(db.projects || []);
      setSubProjects(db.subProjects || []);
      setActivityTypes(db.activityTypes || []);
      setTeamMembers(db.teamMembers || []);
    } catch (err) {
      showToast('Failed to load data from secure APIs.', 'error');
    } finally {
      setIsDataLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const handleSaveEntry = async (entryData) => {
    try {
      if (entryData.id) {
        const updatedEntry = await api.updateTimeEntry(entryData.id, entryData);
        setTimeEntries((prev) => prev.map((e) => (e.id === entryData.id ? updatedEntry : e)));
        showToast('Time entry updated successfully.', 'success');
      } else {
        const newEntry = await api.addTimeEntry(entryData);
        setTimeEntries((prev) => [...prev, newEntry]);
        showToast('Time entry added successfully.', 'success');
      }
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
      showToast(`Failed to save time entry: ${error.message}`, 'error');
    }
  };

  const deleteTimeEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.deleteTimeEntry(id);
        // Check if this entry has team members - if so, mark as deleted for current user (soft delete)
        const entry = timeEntries.find((e) => e.id === id);
        if (entry && Array.isArray(entry.teamMemberIds) && entry.teamMemberIds.length > 0) {
          setTimeEntries((prev) => prev.map((e) =>
              e.id === id ? { ...e, deletedFor: [...(e.deletedFor || []), user.id] } : e
            )
          );
        } else {
          setTimeEntries((prev) => prev.filter((e) => e.id !== id));
        }
        showToast('Time entry deleted.', 'info');
      } catch (error) {
        showToast(`Failed to delete entry: ${error.message}`, 'error');
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

  const handleAddItem = (key, createdBy) => async (name) => {
    try {
      const newItem = await api.addItem(key, { name, createdBy });
      if (key === 'companies') setCompanies(p => [...p, newItem]);
      else if (key === 'stakeholders') setStakeholders(p => [...p, newItem]);
      else if (key === 'projects') setProjects(p => [...p, newItem]);
      else if (key === 'subProjects') setSubProjects(p => [...p, newItem]);
      else if (key === 'teamMembers') setTeamMembers(p => [...p, newItem]);
      showToast(`${key.slice(0, -1).replace(/([A-Z])/g, ' $1').trim()} added successfully.`, 'success');
    } catch (error) {
      showToast(`Failed to add item: ${error.message}`, 'error');
    }
  };

  const handleDeleteItem = (key) => async (id) => {
    let list = [];
    if (key === 'companies') list = companies;
    else if (key === 'stakeholders') list = stakeholders;
    else if (key === 'projects') list = projects;
    else if (key === 'subProjects') list = subProjects;
    else if (key === 'teamMembers') list = teamMembers;

    const item = list.find(i => i.id === id);
    if (!item) return;

    const isOwner = item.createdBy === user.id;
    const isManagerOfCreator = users.find(u => u.id === item.createdBy)?.reportsTo === user.id;

    if (!isOwner && !isManagerOfCreator) {
      showToast(`You do not have permission to delete this ${key.slice(0, -1)}. Only the owner or their manager can delete it.`, 'warning');
      return;
    }

    try {
      await api.deleteItem(key, id);
      if (key === 'companies') setCompanies(p => p.filter(i => i.id !== id));
      else if (key === 'stakeholders') setStakeholders(p => p.filter(i => i.id !== id));
      else if (key === 'projects') setProjects(p => p.filter(i => i.id !== id));
      else if (key === 'subProjects') setSubProjects(p => p.filter(i => i.id !== id));
      else if (key === 'teamMembers') setTeamMembers(p => p.filter(i => i.id !== id));
      showToast(`${key.slice(0, -1).replace(/([A-Z])/g, ' $1').trim()} deleted.`, 'info');
    } catch (error) {
      showToast(`Failed to delete item: ${error.message}`, 'error');
    }
  };

  const handleUpdateItem = (key) => async (id, newName) => {
    try {
      const updatedItem = await api.updateItem(key, id, { name: newName });
      if (key === 'companies') setCompanies(p => p.map(i => i.id === id ? updatedItem : i));
      else if (key === 'stakeholders') setStakeholders(p => p.map(i => i.id === id ? updatedItem : i));
      else if (key === 'teamMembers') setTeamMembers(p => p.map(i => i.id === id ? updatedItem : i));
      showToast(`${key.slice(0, -1).replace(/([A-Z])/g, ' $1').trim()} updated successfully.`, 'success');
    } catch (error) {
      showToast(`Failed to update item: ${error.message}`, 'error');
    }
  };

  const handleUpdateProject = async (id, projectData) => {
    try {
      const updatedProject = await api.updateItem('projects', id, projectData);
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)));
      showToast('Project updated successfully.', 'success');
    } catch (error) {
      showToast(`Failed to update project: ${error.message}`, 'error');
    }
  };

  const handleAddProject = async (name, companyIds, purpose) => {
    try {
      const newProject = await api.addItem('projects', { name, companyIds, purpose, createdBy: user.id });
      setProjects((prev) => [...prev, newProject]);
      showToast('Project added successfully.', 'success');
    } catch (error) {
      showToast(`Failed to add project: ${error.message}`, 'error');
    }
  };

  const handleAddSubProject = async (name, projectId) => {
    try {
      const newSubProject = await api.addItem('subProjects', { name, projectId, createdBy: user.id });
      setSubProjects((prev) => [...prev, newSubProject]);
      showToast('Sub-project added successfully.', 'success');
    } catch (error) {
      showToast(`Failed to add sub-project: ${error.message}`, 'error');
    }
  };

  const userTimeEntries = useMemo(() => {
    let entries = timeEntries.filter(
      (e) => {
        const isOwner = e.userId === user.id;
        const isTeamMember = Array.isArray(e.teamMemberIds) && e.teamMemberIds.includes(user.id);
        const isDeletedForUser = Array.isArray(e.deletedFor) && e.deletedFor.includes(user.id);
        return (isOwner || isTeamMember) && !isDeletedForUser;
      }
    );
    if (dateFilter) entries = entries.filter((e) => e.date === dateFilter);
    if (projectFilter) entries = entries.filter((e) => e.projectId === projectFilter);
    if (companyFilter) {
      const companyProjectIds = projects.filter((p) => p.companyId === companyFilter).map((p) => p.id);
      entries = entries.filter((e) => companyProjectIds.includes(e.projectId));
    }
    if (stakeholderFilter) {
      const stakeholderProjectIds = projects.filter((p) => p.stakeholderId === stakeholderFilter).map((p) => p.id);
      entries = entries.filter((e) => stakeholderProjectIds.includes(e.projectId));
    }
    if (activityFilter) entries = entries.filter((e) => e.activityTypeId === activityFilter);
    if (priorityFilter) entries = entries.filter((e) => e.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e) => e.description?.toLowerCase().includes(q));
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [timeEntries, projects, user.id, dateFilter, projectFilter, companyFilter, stakeholderFilter, activityFilter, priorityFilter, searchQuery]);

  // Use the local arrays directly since they are now securely scoped by the backend
  const userCompanies = companies;
  const userStakeholders = stakeholders;
  const userProjects = projects;
  const userSubProjects = subProjects;
  const userActivityTypes = activityTypes;

  const userTeamMembers = useMemo(() => {
    const customTeammates = teamMembers;
    const realUsersAsTeammates = users
      .filter(u => u.id !== user.id)
      .map(u => ({ id: u.id, name: u.name, isRealUser: true }));

    return [...customTeammates, ...realUsersAsTeammates];
  }, [teamMembers, users, user.id]);

  // Create a local `fullDb` object to pass down to children components 
  // so they don't break until they are also refactored to fetch their own data.
  const localDb = { users, timeEntries, companies, stakeholders, projects, subProjects, activityTypes, teamMembers };

  const handleAiFill = async ({ projectName, companyNames, subProjects, purpose }) => {
    // 1. Create or reuse companies
    const companyIds = [];
    for (const name of companyNames) {
      let company = userCompanies.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!company) {
        company = await api.addItem('companies', { name, createdBy: user.id });
        setFullDb((prev) => ({ ...prev, companies: [...prev.companies, company] }));
      }
      companyIds.push(company.id || company._id);
    }

    // 2. Create project
    const newProject = await api.addItem('projects', {
      name: projectName,
      companyIds,
      purpose,
      createdBy: user.id,
    });
    setProjects((prev) => [...prev, newProject]);

    // 4. Create sub-projects sequentially
    const projectId = newProject.id || newProject._id;
    const createdSubProjects = [];
    for (const spName of subProjects) {
      const sp = await api.addItem('subProjects', { name: spName, projectId, createdBy: user.id });
      createdSubProjects.push(sp);
    }
    if (createdSubProjects.length > 0) {
      setSubProjects((prev) => [...prev, ...createdSubProjects]);
    }
    showToast(`Project "${projectName}" created with ${createdSubProjects.length} sub-projects.`, 'success');
  };


  const clearFilters = () => {
    setDateFilter('');
    setProjectFilter('');
    setCompanyFilter('');
    setStakeholderFilter('');
    setActivityFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = dateFilter || projectFilter || companyFilter || stakeholderFilter || activityFilter || priorityFilter || searchQuery;

  const handleGenerateReport = async () => {
    if (userTimeEntries.length === 0) {
      showToast('No entries to summarize.', 'warning');
      return;
    }
    setIsReportModalOpen(true);
    setIsGeneratingReport(true);
    setReportData(null);
    try {
      const result = await api.generateSummary(userTimeEntries, localDb, 'employee');
      setReportData(result.summary);
    } catch (error) {
      showToast(`Failed to generate report: ${error.message}`, 'error');
      setIsReportModalOpen(false);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadCsv = async () => {
    if (userTimeEntries.length === 0) {
      showToast('No entries to download.', 'warning');
      return;
    }
    const dataToExport = userTimeEntries.map((entry) => {
      const project = projects.find((p) => p.id === entry.projectId);
      const company = companies.find((c) => c.id === project?.companyId);
      return {
        Date: entry.date,
        StartTime: entry.startTime,
        EndTime: entry.endTime,
        Hours: entry.hours.toFixed(2),
        Company: company?.name || 'N/A',
        Project: project?.name || 'N/A',
        SubProject: (entry.subProjectIds || (entry.subProjectId ? [entry.subProjectId] : [])).map(id => subProjects.find(sp => sp.id === id)?.name).filter(Boolean).join(', ') || 'N/A',
        Activity: activityTypes.find((a) => a.id === entry.activityTypeId)?.name || 'N/A',
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
      showToast('CSV downloaded successfully.', 'success');
    } catch (error) {
      showToast(`Failed to download CSV: ${error.message}`, 'error');
    }
  };

  return (
    <MainLayout user={user} onLogout={onLogout} activeView={activeView} onNavigate={setActiveView} onDownloadCsv={handleDownloadCsv} onGenerateSummary={handleGenerateReport} hasBothRoles={hasBothRoles} activeRole={activeRole} onToggleRole={onToggleRole}>
      {activeView === 'dashboard' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Dashboard Header */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Timesheet</h2>
                <p className="text-sm text-slate-400 mt-0.5">Track and manage your daily work entries.</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl shadow-inner">
                  <button onClick={() => setDashboardViewMode('table')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${dashboardViewMode === 'table' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TableIcon /> Table</button>
                  <button onClick={() => setDashboardViewMode('calendar')} className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${dashboardViewMode === 'calendar' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon /> Calendar</button>
                </div>
                <button onClick={handleStartTimer} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-green rounded-xl shadow-md shadow-brand-green/20 hover:bg-brand-green-dark hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  <PlayIcon /> Start Timer
                </button>
                <button onClick={() => { setFormInitialData(null); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-xl shadow-md shadow-brand-blue/20 hover:bg-brand-blue-mid hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  <PlusIcon /> Add Entry
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
          {dashboardViewMode === 'table' ? (
            <>
              {/* Filters */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 text-sm">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                    <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm">
                      <option value="">All Projects</option>
                      {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
                    <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm">
                      <option value="">All Companies</option>
                      {userCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stakeholder</label>
                    <select value={stakeholderFilter} onChange={(e) => setStakeholderFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm">
                      <option value="">All Stakeholders</option>
                      {userStakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Activity</label>
                    <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm">
                      <option value="">All Activities</option>
                      {userActivityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm">
                      <option value="">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search</label>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Descriptionâ€¦" className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-sky-400 focus:ring-0 outline-none transition-all shadow-sm" />
                  </div>
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-sm text-slate-500 font-medium">{userTimeEntries.length} {userTimeEntries.length === 1 ? 'entry' : 'entries'} found</span>
                  <button onClick={clearFilters} className="text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wide transition-colors">Clear all filters</button>
                </div>
              )}

              <TimeEntryList entries={userTimeEntries} allUsers={users} fullDb={localDb} onDeleteEntry={deleteTimeEntry} onEditEntry={handleEditEntry} currentUserId={user.id} />
            </>
          ) : dashboardViewMode === 'calendar' ? (
            <EmployeeCalendarView entries={userTimeEntries} fullDb={localDb} currentUser={user} onEditEntry={handleEditEntry} />
          ) : null}
        </div>
      </div>
      ) : activeView === 'taskkeep' ? (
        <TaskKeepView
          user={user}
          fullDb={localDb}
          setFullDb={() => {}} // Stub it until TaskKeepView is refactored 
          isManager={false}
          showToast={showToast}
          onOpenTimeEntryForm={(prefill) => {
            setFormInitialData(prefill);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="space-y-5">

          {/* Top row: Quick Stats + AI Fill */}
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Companies</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-lg font-extrabold text-slate-800 leading-none">{String(userCompanies.length).padStart(2, '0')}</span>
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden self-center">
                    <div className="h-full bg-brand-blue rounded-full" style={{ width: `${Math.min(100, userCompanies.length * 10)}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Team Members</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-lg font-extrabold text-slate-800 leading-none">{String(userTeamMembers.length).padStart(2, '0')}</span>
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden self-center">
                    <div className="h-full bg-brand-green rounded-full" style={{ width: `${Math.min(100, userTeamMembers.length * 8)}%` }} />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Projects</span>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-lg font-extrabold text-slate-800 leading-none">{String(userProjects.length).padStart(2, '0')}</span>
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden self-center">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, userProjects.length * 15)}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAiFillOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold text-white rounded-2xl shadow-sm hover:opacity-90 active:scale-95 transition-all bg-brand-blue shrink-0"
            >
              <AiWandIcon />
              AI Fill
            </button>
          </div>

          {/* Active Projects */}
          <ProjectConfig projects={userProjects} companies={userCompanies} onAdd={handleAddProject} onDelete={handleDeleteItem('projects')} onUpdate={handleUpdateProject} />

          {/* Project Scope | , Stakeholders, Team Members */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4">
              <SubProjectConfig projects={userProjects} subProjects={userSubProjects} onAdd={handleAddSubProject} onDelete={handleDeleteItem('subProjects')} />
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <ConfigManager title="Companies" items={userCompanies} onAdd={handleAddItem('companies', user.id)} onDelete={handleDeleteItem('companies')} onUpdate={handleUpdateItem('companies')} />
              <ConfigManager title="Stakeholders" items={userStakeholders} onAdd={handleAddItem('stakeholders', user.id)} onDelete={handleDeleteItem('stakeholders')} onUpdate={handleUpdateItem('stakeholders')} />
              <ConfigManager title="Team Members" items={userTeamMembers} onAdd={handleAddItem('teamMembers', user.id)} onDelete={handleDeleteItem('teamMembers')} onUpdate={handleUpdateItem('teamMembers')} />
            </div>
          </div>

        </div>
      )}
      {isTimerOpen && <TimerModal onStop={handleStopTimer} />}
      {isFormOpen && (
        <TimeEntryForm
          userId={user.id}
          onSaveEntry={handleSaveEntry}
          onClose={() => { setIsFormOpen(false); setFormInitialData(null); }}
          fullDb={localDb}
          initialData={formInitialData}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          reportData={reportData}
          isGenerating={isGeneratingReport}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
      {isAiFillOpen && (
        <AiFillModal
          existingProjects={userProjects}
          companies={userCompanies}
          stakeholders={userStakeholders}
          user={user}
          onClose={() => setIsAiFillOpen(false)}
          onSave={handleAiFill}
        />
      )}
      <Toast toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  );
}
