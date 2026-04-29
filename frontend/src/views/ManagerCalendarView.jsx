import { useState, useMemo } from 'react';
import { marked } from 'marked';
import { formatActivities } from '../utils/timeEntryActivities';

export default function ManagerCalendarView({ entries, fullDb, directReports }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);

  const projectMap = useMemo(() => new Map(fullDb.projects.map((p) => [p.id, p.name])), [fullDb.projects]);
  const userMap = useMemo(() => new Map(fullDb.users.map((u) => [u.id, u.name])), [fullDb.users]);
  const subProjectMap = useMemo(() => new Map(fullDb.subProjects.map((sp) => [sp.id, sp.name])), [fullDb.subProjects]);
  const stakeholderMap = useMemo(() => new Map(fullDb.stakeholders.map((s) => [s.id, s.name])), [fullDb.stakeholders]);
  
  const teamMemberMap = useMemo(() => {
    const map = new Map(fullDb.users.map((u) => [u.id, u.name]));
    (fullDb.teamMembers || []).forEach(tm => { if (!map.has(tm.id)) map.set(tm.id, tm.name); });
    return map;
  }, [fullDb.users, fullDb.teamMembers]);

  const userColorMap = useMemo(() => {
    const colors = ['#38bdf8', '#fb923c', '#a78bfa', '#f472b6', '#22d3ee', '#facc15', '#4ade80', '#818cf8'];
    const map = new Map();
    // Use all assigned users to color properly
    const uniqueUsers = Array.from(new Set(entries.map(e => e.userId).filter(Boolean)));
    uniqueUsers.forEach((userId, i) => {
      map.set(userId, colors[i % colors.length]);
    });
    return map;
  }, [entries]);

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = [];
  const dayOfWeek = startOfMonth.getDay();
  for (let i = 0; i < (dayOfWeek === 0 ? 6 : dayOfWeek - 1); i++) {
    daysInMonth.push(null);
  }
  for (let date = new Date(startOfMonth); date <= endOfMonth; date.setDate(date.getDate() + 1)) {
    daysInMonth.push(new Date(date));
  }

  const entriesByDate = useMemo(() => {
    return (entries || []).reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const changeMonth = (offset) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-bold">&lt;</button>
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 mr-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm">Today</button>
          <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-bold">&gt;</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Legend:</span>
        {Array.from(userColorMap.entries()).map(([userId, color]) => (
          <div key={userId} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
            <span className="text-xs font-semibold text-slate-600">{userMap.get(userId) || 'Unknown'}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-bold text-xs py-3 bg-slate-50 text-slate-500 uppercase tracking-wider">{day}</div>
        ))}
        {daysInMonth.map((day, index) => {
          const isToday = day && day.toDateString() === new Date().toDateString();
          const dateStr = day ? day.toISOString().split('T')[0] : null;
          const dayEntries = day && entriesByDate[dateStr] ? entriesByDate[dateStr] : [];
          const isWeekend = day && (day.getDay() === 0 || day.getDay() === 6);
          
          return (
            <div key={index} className={`bg-white p-2 min-h-[140px] relative ${!day ? 'bg-slate-50' : ''} ${isWeekend && day ? 'bg-slate-50/50' : ''} ${isToday ? 'ring-2 ring-inset ring-brand-blue/50' : ''}`}>
              {day && (
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-semibold flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-brand-blue text-white shadow-md' : 'text-slate-600'}`}>
                    {day.getDate()}
                  </span>
                  {dayEntries.length > 0 && (
                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded shadow-inner">
                      {dayEntries.reduce((acc, e) => acc + e.hours, 0).toFixed(1)}h
                    </span>
                  )}
                </div>
              )}
              <div className="space-y-1.5 overflow-y-auto max-h-[100px] hide-scrollbar">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="text-white text-[11px] font-medium rounded-md px-2 py-1.5 truncate cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm"
                    style={{ backgroundColor: userColorMap.get(entry.userId) || '#94a3b8' }}
                    title={`${userMap.get(entry.userId)}: ${projectMap.get(entry.projectId) || 'Unknown Project'} - ${entry.hours}h`}
                  >
                    <span className="font-bold mr-1">{entry.hours.toFixed(1)}h</span>
                    {userMap.get(entry.userId) || 'Unknown'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Time Entry Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Logged by {userMap.get(selectedEntry.userId) || 'Unknown'}</p>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 text-slate-500 transition-colors text-lg font-bold">&times;</button>
            </div>
            
            <div className="p-6 space-y-5 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Logged</span>
                  <div className="font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg inline-block border border-slate-100">{selectedEntry.date}</div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration</span>
                  <div className="font-semibold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg inline-block border border-sky-100">
                    {selectedEntry.hours.toFixed(2)} hrs 
                    <span className="text-xs font-medium text-sky-500/80 ml-2">({selectedEntry.startTime?.slice(0,5) || 'N/A'} - {selectedEntry.endTime?.slice(0,5) || 'N/A'})</span>
                  </div>
                </div>
                
                <div className="col-span-2 border-t border-slate-100 pt-3"></div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</span>
                  <div className="font-medium text-slate-800">{projectMap.get(selectedEntry.projectId) || 'N/A'}</div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sub-Project</span>
                  <div className="font-medium text-slate-600">{(selectedEntry.subProjectIds || (selectedEntry.subProjectId ? [selectedEntry.subProjectId] : [])).map(id => subProjectMap.get(id)).filter(Boolean).join(', ') || 'N/A'}</div>
                </div>
                
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Type</span>
                  <div className="font-medium bg-slate-100 inline-block px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 border border-slate-200">{formatActivities(selectedEntry, fullDb.activityTypes)}</div>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location & Priority</span>
                  <div className="font-medium text-slate-700">
                    {selectedEntry.workLocation || 'Office'}
                    <span className="mx-2 text-slate-300">•</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${selectedEntry.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' : selectedEntry.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {selectedEntry.priority || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedEntry.teamMemberIds?.length > 0 || selectedEntry.stakeholderIds?.length > 0) && (
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  {selectedEntry.teamMemberIds?.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Team Members</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.teamMemberIds.map(id => teamMemberMap.get(id)).filter(Boolean).map(name => (
                          <span key={name} className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs font-medium">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedEntry.stakeholderIds?.length > 0 && (
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Stakeholders</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.stakeholderIds.map(id => stakeholderMap.get(id)).filter(Boolean).map(name => (
                          <span key={name} className="px-2 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-md text-xs font-medium">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedEntry.description && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</span>
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 prose prose-sm prose-slate max-w-none shadow-inner text-[13px] max-h-24 overflow-y-auto overflow-x-hidden break-words [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
                    dangerouslySetInnerHTML={{ __html: marked.parse(selectedEntry.description) }}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedEntry(null)} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-all hover:border-slate-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
