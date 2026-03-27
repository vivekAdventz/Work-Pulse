import { useState, useMemo } from 'react';
import { IonButton } from '@ionic/react';

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
    <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <IonButton fill="outline" size="small" onClick={() => changeMonth(-1)}>&lt;</IonButton>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <IonButton fill="outline" size="small" onClick={() => setCurrentDate(new Date())}>Today</IonButton>
          <IonButton fill="outline" size="small" onClick={() => changeMonth(1)}>&gt;</IonButton>
        </div>
      </div>

      {/* Legend */}
      {directReports.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ion-color-medium)' }}>Legend:</span>
          {Array.from(userColorMap.entries()).map(([userId, color]) => (
            <div key={userId} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 4 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--ion-color-medium)' }}>{userMap.get(userId)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.65rem', padding: 4, background: '#f1f5f9', color: '#64748b' }}>{day}</div>
        ))}
        {daysInMonth.map((day, index) => (
          <div key={index} style={{ background: 'white', padding: 2, minHeight: 60, position: 'relative' }}>
            {day && <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{day.getDate()}</span>}
            {day && entriesByDate[day.toISOString().split('T')[0]]?.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                style={{
                  color: 'white', fontSize: '0.5rem', borderRadius: 2, padding: '1px 2px', marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  background: userColorMap.get(entry.userId) || '#a1a1aa',
                }}
                title={`${userMap.get(entry.userId)} - ${projectMap.get(entry.projectId)} (${entry.hours}h)`}
              >
                {projectMap.get(entry.projectId)?.slice(0, 6)} ({entry.hours.toFixed(0)}h)
              </div>
            ))}
            {day && (entriesByDate[day.toISOString().split('T')[0]]?.length || 0) > 3 && (
              <div style={{ fontSize: '0.5rem', color: '#64748b', textAlign: 'center' }}>
                +{entriesByDate[day.toISOString().split('T')[0]].length - 3} more
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
