import { useState } from 'react';
import TimeEntryList from './TimeEntryList';
import { FolderIcon, ArrowLeftIcon, EmptyIcon } from '../common/Icons';

export default function EmployeeCardView({ projects, subProjects, timeEntries, allUsers, fullDb, onDeleteEntry, onEditEntry, currentUserId }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState(null);

  if (selectedSubProjectId) {
    const activeSubProject = subProjects.find(sp => sp.id === selectedSubProjectId);
    const activeProject = projects.find(p => p.id === selectedProjectId);
    
    let filteredEntries;
    if (selectedSubProjectId === 'none') {
      filteredEntries = timeEntries.filter(e => e.projectId === selectedProjectId && !e.subProjectId);
    } else {
      filteredEntries = timeEntries.filter(e => e.projectId === selectedProjectId && e.subProjectId === selectedSubProjectId);
    }

    return (
      <div className="animate-fade-in relative">
        <div className="flex items-center gap-2 mb-6 text-slate-600 font-medium whitespace-nowrap overflow-x-auto pb-2">
          <button onClick={() => { setSelectedProjectId(null); setSelectedSubProjectId(null); }} className="hover:text-sky-600 px-1 hover:bg-sky-50 rounded transition-colors">Projects</button>
          <span>/</span>
          <button onClick={() => setSelectedSubProjectId(null)} className="hover:text-sky-600 px-1 hover:bg-sky-50 rounded transition-colors max-w-xs truncate" title={activeProject?.name}>{activeProject?.name || 'Unknown Project'}</button>
          <span>/</span>
          <span className="text-slate-800 px-1 truncate max-w-xs" title={activeSubProject?.name || 'Uncategorized'}>{activeSubProject?.name || 'Uncategorized Tasks'}</span>
          <button onClick={() => setSelectedSubProjectId(null)} className="ml-auto flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition font-semibold"><ArrowLeftIcon /> Back</button>
        </div>
        <TimeEntryList entries={filteredEntries} allUsers={allUsers} fullDb={fullDb} onDeleteEntry={onDeleteEntry} onEditEntry={onEditEntry} currentUserId={currentUserId} />
      </div>
    );
  }

  if (selectedProjectId) {
    const activeProject = projects.find(p => p.id === selectedProjectId);
    const projectSubProjects = subProjects.filter(sp => sp.projectId === selectedProjectId);
    const entriesWithoutSubProject = timeEntries.filter(e => e.projectId === selectedProjectId && !e.subProjectId);
    
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-6 text-slate-600 font-medium">
          <button onClick={() => setSelectedProjectId(null)} className="hover:text-sky-600 px-1 hover:bg-sky-50 rounded transition-colors">Projects</button>
          <span>/</span>
          <span className="text-slate-800 px-1 truncate max-w-sm">{activeProject?.name || 'Unknown Project'}</span>
          <button onClick={() => setSelectedProjectId(null)} className="ml-auto flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition font-semibold"><ArrowLeftIcon /> Back</button>
        </div>
        
        {projectSubProjects.length === 0 && entriesWithoutSubProject.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
             <EmptyIcon />
             <p className="mt-4">This project has no active sub-projects or tasks assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projectSubProjects.map(sp => {
              const spEntries = timeEntries.filter(e => e.projectId === selectedProjectId && e.subProjectId === sp.id);
              const totalHours = spEntries.reduce((acc, e) => acc + e.hours, 0);
              return (
                <div key={sp.id} onClick={() => setSelectedSubProjectId(sp.id)} className="bg-white border rounded-xl shadow-sm hover:shadow-lg hover:border-sky-400 p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-sky-500 mb-4 bg-sky-50 w-12 h-12 flex items-center justify-center rounded-xl"><FolderIcon /></div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-1 truncate" title={sp.name}>{sp.name}</h3>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{spEntries.length} tasks</span>
                    <span className="font-semibold text-slate-700">{totalHours.toFixed(1)} hrs</span>
                  </div>
                </div>
              );
            })}
            {entriesWithoutSubProject.length > 0 && (
                <div onClick={() => setSelectedSubProjectId('none')} className="bg-white border border-dashed border-slate-300 rounded-xl shadow-sm hover:shadow-lg hover:border-sky-400 p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-slate-400 mb-4 bg-slate-100 w-12 h-12 flex items-center justify-center rounded-xl"><FolderIcon /></div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-1 truncate">Direct Tasks</h3>
                  <p className="text-sm text-slate-500 mt-2 mb-2">Uncategorized tasks for this project</p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{entriesWithoutSubProject.length} tasks</span>
                    <span className="font-semibold text-slate-700">{entriesWithoutSubProject.reduce((a, b) => a + b.hours, 0).toFixed(1)} hrs</span>
                  </div>
                </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Identify all unique projects the user has entries for, or fallback to all user projects.
  // Actually, we should show projects the user created PLUS projects they have entries in to be fully exhaustive.
  // We'll map through all projects in the system and show ones where they have entries, OR where they created it.
  const projectIdsWithEntries = new Set(timeEntries.map(e => e.projectId).filter(Boolean));
  // we are given 'projects' list which is already 'userProjects' (created by user). Let's expand this in EmployeeView later or assume it's correct.
  // Wait, if they have entries in a project they didn't create, the parent view should pass it down.
  // Let's use the provided projects prop for mapping.
  
  return (
    <div className="animate-fade-in">
      {projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300 mt-4">
             <EmptyIcon />
             <p className="mt-4 text-base">You don't have any projects assigned yet.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
          {projects.map(p => {
            const pEntries = timeEntries.filter(e => e.projectId === p.id);
            const totalHours = pEntries.reduce((acc, e) => acc + e.hours, 0);
            return (
              <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-sky-400 p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="text-sky-600 bg-sky-100 shadow-sky-100/50 shadow-lg w-12 h-12 flex items-center justify-center rounded-xl"><FolderIcon /></div>
                  {pEntries.length > 0 && <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 font-semibold rounded-full">{pEntries.length} tasks</span>}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mt-4 mb-2 line-clamp-2" title={p.name}>{p.name}</h3>
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                  <p className="text-sm text-slate-500 flex justify-between items-center">
                    <span className="font-medium">Total Time Logged</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg shadow-inner">{totalHours.toFixed(1)} hrs</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
