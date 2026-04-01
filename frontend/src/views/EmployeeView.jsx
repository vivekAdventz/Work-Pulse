import { useState, useMemo } from 'react';
import api from '../api';
import MainLayout from '../components/MainLayout';
import TimeEntryList from '../components/TimeEntryList';
import EmployeeCardView from '../components/EmployeeCardView';
import TimeEntryForm from '../components/TimeEntryForm';
import TimerModal from '../components/TimerModal';
import ReportModal from '../components/ReportModal';
import ConfigManager from '../components/ConfigManager';
import SubProjectConfig from '../components/SubProjectConfig';
import ProjectConfig from '../components/ProjectConfig';
import AiFillModal from '../components/AiFillModal';
import { PlusIcon, PlayIcon, GridIcon, TableIcon, AiWandIcon } from '../components/Icons';

export default function EmployeeView({ user, fullDb, setFullDb, onLogout, hasBothRoles = false, activeRole = null, onToggleRole = null }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardViewMode, setDashboardViewMode] = useState('table');
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

  const getCurrentTime = () => new Date().toTimeString().slice(0, 8);

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

  const handleAddItem = (key, createdBy) => async (name) => {
    try {
      const newItem = await api.addItem(key, { name, createdBy });
      setFullDb((prev) => ({ ...prev, [key]: [...prev[key], newItem] }));
    } catch (error) {
      alert(`Failed to add item: ${error.message}`);
    }
  };

  const handleDeleteItem = (key) => async (id) => {
    // Check if user is owner or manager
    const item = fullDb[key].find(i => i.id === id);
    if (!item) return;

    const isOwner = item.createdBy === user.id;
    const isManagerOfCreator = fullDb.users.find(u => u.id === item.createdBy)?.reportsTo === user.id;

    if (!isOwner && !isManagerOfCreator) {
      alert(`You do not have permission to delete this ${key.slice(0, -1)}. Only the owner or their manager can delete it.`);
      return;
    }

    try {
      await api.deleteItem(key, id);
      setFullDb((prev) => ({ ...prev, [key]: prev[key].filter((item) => item.id !== id) }));
    } catch (error) {
      alert(`Failed to delete item: ${error.message}`);
    }
  };

  const handleUpdateItem = (key) => async (id, newName) => {
    try {
      const updatedItem = await api.updateItem(key, id, { name: newName });
      setFullDb((prev) => ({ ...prev, [key]: prev[key].map((item) => (item.id === id ? updatedItem : item)) }));
    } catch (error) {
      alert(`Failed to update item: ${error.message}`);
    }
  };

  const handleAddProject = async (name, companyIds, stakeholderIds) => {
    try {
      const newProject = await api.addItem('projects', { name, companyIds, stakeholderIds, createdBy: user.id });
      setFullDb((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
    } catch (error) {
      alert(`Failed to add project: ${error.message}`);
    }
  };

  const handleAddSubProject = async (name, projectId) => {
    try {
      const newSubProject = await api.addItem('subProjects', { name, projectId, createdBy: user.id });
      setFullDb((prev) => ({ ...prev, subProjects: [...prev.subProjects, newSubProject] }));
    } catch (error) {
      alert(`Failed to add sub-project: ${error.message}`);
    }
  };

  const userTimeEntries = useMemo(() => {
    let entries = fullDb.timeEntries.filter((e) => e.userId === user.id);
    if (dateFilter) entries = entries.filter((e) => e.date === dateFilter);
    if (projectFilter) entries = entries.filter((e) => e.projectId === projectFilter);
    if (companyFilter) {
      const companyProjectIds = fullDb.projects.filter((p) => p.companyId === companyFilter).map((p) => p.id);
      entries = entries.filter((e) => companyProjectIds.includes(e.projectId));
    }
    if (stakeholderFilter) {
      const stakeholderProjectIds = fullDb.projects.filter((p) => p.stakeholderId === stakeholderFilter).map((p) => p.id);
      entries = entries.filter((e) => stakeholderProjectIds.includes(e.projectId));
    }
    if (activityFilter) entries = entries.filter((e) => e.activityTypeId === activityFilter);
    if (priorityFilter) entries = entries.filter((e) => e.priority === priorityFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((e) => e.description?.toLowerCase().includes(q));
    }
    return entries.sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [fullDb.timeEntries, fullDb.projects, user.id, dateFilter, projectFilter, companyFilter, stakeholderFilter, activityFilter, priorityFilter, searchQuery]);

  const teamUserIds = useMemo(() => {
    // Current user's manager ID (the head of the team)
    const managerId = user.reportsTo || user.id;
    // Everyone reporting to that same manager
    const siblings = fullDb.users.filter(u => u.reportsTo === managerId || u.id === managerId);
    // Plus anyone who reports DIRECTLY to the current user (if current user is a manager)
    const directReports = fullDb.users.filter(u => u.reportsTo === user.id);
    
    const ids = new Set([user.id, managerId, ...siblings.map(u => u.id), ...directReports.map(u => u.id)]);
    return Array.from(ids);
  }, [fullDb.users, user.id, user.reportsTo]);

  const userCompanies = useMemo(() => fullDb.companies.filter((i) => teamUserIds.includes(i.createdBy)), [fullDb.companies, teamUserIds]);
  const userStakeholders = useMemo(() => fullDb.stakeholders.filter((i) => teamUserIds.includes(i.createdBy)), [fullDb.stakeholders, teamUserIds]);
  const userProjects = useMemo(() => fullDb.projects.filter((i) => teamUserIds.includes(i.createdBy)), [fullDb.projects, teamUserIds]);
  const userSubProjects = useMemo(() => fullDb.subProjects.filter((i) => teamUserIds.includes(i.createdBy)), [fullDb.subProjects, teamUserIds]);
  const userActivityTypes = useMemo(() => fullDb.activityTypes || [], [fullDb.activityTypes]);

  const userTeamMembers = useMemo(() => {
    // 1. Custom team members created by anyone in the group
    const customTeammates = fullDb.teamMembers.filter((i) => teamUserIds.includes(i.createdBy));
    // 2. Real users in the same team group (excluding self)
    const realUsersAsTeammates = fullDb.users
      .filter(u => teamUserIds.includes(u.id) && u.id !== user.id)
      .map(u => ({ id: u.id, name: u.name, isRealUser: true }));
    
    return [...customTeammates, ...realUsersAsTeammates];
  }, [fullDb.teamMembers, fullDb.users, teamUserIds, user.id]);

  const handleAiFill = async ({ projectName, companyNames, stakeholderNames, subProjects, purpose, yourRole }) => {
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

    // 2. Create or reuse stakeholders
    const stakeholderIds = [];
    for (const name of stakeholderNames) {
      let stakeholder = userStakeholders.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!stakeholder) {
        stakeholder = await api.addItem('stakeholders', { name, createdBy: user.id });
        setFullDb((prev) => ({ ...prev, stakeholders: [...prev.stakeholders, stakeholder] }));
      }
      stakeholderIds.push(stakeholder.id || stakeholder._id);
    }

    // 3. Create project
    const newProject = await api.addItem('projects', {
      name: projectName,
      companyIds,
      stakeholderIds,
      purpose,
      yourRole,
      createdBy: user.id,
    });
    setFullDb((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));

    // 4. Create sub-projects sequentially
    const projectId = newProject.id || newProject._id;
    const createdSubProjects = [];
    for (const spName of subProjects) {
      const sp = await api.addItem('subProjects', { name: spName, projectId, createdBy: user.id });
      createdSubProjects.push(sp);
    }
    if (createdSubProjects.length > 0) {
      setFullDb((prev) => ({ ...prev, subProjects: [...prev.subProjects, ...createdSubProjects] }));
    }
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
      alert('No entries to summarize.');
      return;
    }
    setIsReportModalOpen(true);
    setIsGeneratingReport(true);
    setReportData(null);
    try {
      const result = await api.generateSummary(userTimeEntries, fullDb);
      setReportData(result.summary);
    } catch (error) {
      alert(`Failed to generate report: ${error.message}`);
      setIsReportModalOpen(false);
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
    <MainLayout user={user} onLogout={onLogout} activeView={activeView} onNavigate={setActiveView} onDownloadCsv={handleDownloadCsv} onGenerateSummary={handleGenerateReport} hasBothRoles={hasBothRoles} activeRole={activeRole} onToggleRole={onToggleRole}>
      {activeView === 'dashboard' ? (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-2xl font-semibold text-slate-700">My Timesheet</h2>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-2 shadow-inner">
                 <button onClick={() => setDashboardViewMode('table')} className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dashboardViewMode === 'table' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}><TableIcon /> Table</button>
                 <button onClick={() => setDashboardViewMode('card')} className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dashboardViewMode === 'card' ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}><GridIcon /> Cards</button>
              </div>
              <button onClick={handleStartTimer} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-transform hover:scale-105">
                <PlayIcon /> Start
              </button>
              <button onClick={() => { setFormInitialData(null); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 transition-transform hover:scale-105">
                <PlusIcon /> Add Entry
              </button>
            </div>
          </div>

          {dashboardViewMode === 'table' ? (
            <>
              {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Project</label>
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">All Projects</option>
                {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Company</label>
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">All Companies</option>
                {userCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Stakeholder</label>
              <select value={stakeholderFilter} onChange={(e) => setStakeholderFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">All Stakeholders</option>
                {userStakeholders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Activity Type</label>
              <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">All Activities</option>
                {userActivityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Search Description</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full p-2 border border-slate-300 rounded-md bg-white" />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">{userTimeEntries.length} {userTimeEntries.length === 1 ? 'entry' : 'entries'} found</span>
              <button onClick={clearFilters} className="text-sm text-sky-600 hover:text-sky-800 font-medium">Clear all filters</button>
            </div>
          )}

          <TimeEntryList entries={userTimeEntries} allUsers={fullDb.users} fullDb={fullDb} onDeleteEntry={deleteTimeEntry} onEditEntry={handleEditEntry} />
            </>
          ) : (
            <EmployeeCardView projects={userProjects} subProjects={userSubProjects} timeEntries={userTimeEntries} allUsers={fullDb.users} fullDb={fullDb} onDeleteEntry={deleteTimeEntry} onEditEntry={handleEditEntry} />
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Config header with Fill by AI button */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-700">Configuration</h2>
            <button
              onClick={() => setIsAiFillOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <AiWandIcon />
              Fill by AI
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-3">
              <ProjectConfig projects={userProjects} companies={userCompanies} stakeholders={userStakeholders} onAdd={handleAddProject} onDelete={handleDeleteItem('projects')} />
            </div>
            <div className="xl:col-span-3">
              <SubProjectConfig projects={userProjects} subProjects={userSubProjects} onAdd={handleAddSubProject} onDelete={handleDeleteItem('subProjects')} />
            </div>
            <ConfigManager title="Companies" items={userCompanies} onAdd={handleAddItem('companies', user.id)} onDelete={handleDeleteItem('companies')} onUpdate={handleUpdateItem('companies')} />
            <ConfigManager title="Stakeholders" items={userStakeholders} onAdd={handleAddItem('stakeholders', user.id)} onDelete={handleDeleteItem('stakeholders')} onUpdate={handleUpdateItem('stakeholders')} />
            <ConfigManager title="Team Members" items={userTeamMembers} onAdd={handleAddItem('teamMembers', user.id)} onDelete={handleDeleteItem('teamMembers')} onUpdate={handleUpdateItem('teamMembers')} />
          </div>
        </div>
      )}

      {isTimerOpen && <TimerModal onStop={handleStopTimer} />}
      {isFormOpen && (
        <TimeEntryForm
          userId={user.id}
          onSaveEntry={handleSaveEntry}
          onClose={() => { setIsFormOpen(false); setFormInitialData(null); }}
          fullDb={fullDb}
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
    </MainLayout>
  );
}
