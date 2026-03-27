import { useState, useMemo } from 'react';

export default function ManagerCalendarView({ entries, fullDb, directReports }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const projectMap = useMemo(() => new Map(fullDb.projects.map((p) => [p.id, p.name])), [fullDb.projects]);
  const userMap = useMemo(() => new Map(fullDb.users.map((u) => [u.id, u.name])), [fullDb.users]);

  const userColorMap = useMemo(() => {
    const colors = ['#38bdf8', '#fb923c', '#4ade80', '#a78bfa', '#f472b6', '#22d3ee', '#facc15', '#818cf8'];
    const map = new Map();
    directReports.forEach((user, i) => {
      map.set(user.id, colors[i % colors.length]);
    });
    return map;
  }, [directReports]);

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
    return entries.reduce((acc, entry) => {
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
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-slate-200 rounded-lg hover:bg-slate-300">&lt;</button>
        <h3 className="text-xl font-semibold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <div>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 mr-2 bg-slate-200 rounded-lg hover:bg-slate-300">Today</button>
          <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-slate-200 rounded-lg hover:bg-slate-300">&gt;</button>
        </div>
      </div>

      {directReports.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
          <span className="text-sm font-medium text-slate-600">Legend:</span>
          {Array.from(userColorMap.entries()).map(([userId, color]) => (
            <div key={userId} className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: color }}></span>
              <span className="text-sm text-slate-500">{userMap.get(userId)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-semibold text-sm py-2 bg-slate-100 text-slate-600">{day}</div>
        ))}
        {daysInMonth.map((day, index) => (
          <div key={index} className="bg-white p-2 min-h-[120px] relative">
            {day && <span className="text-sm text-slate-500">{day.getDate()}</span>}
            {day && entriesByDate[day.toISOString().split('T')[0]]?.map((entry) => (
              <div
                key={entry.id}
                className="text-white text-xs rounded p-1 mt-1 truncate"
                style={{ backgroundColor: userColorMap.get(entry.userId) || '#a1a1aa' }}
                title={`${userMap.get(entry.userId)} - ${projectMap.get(entry.projectId)} (${entry.hours}h): ${entry.description}`}
              >
                {projectMap.get(entry.projectId)} ({entry.hours.toFixed(1)}h)
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
