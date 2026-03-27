export default function PieChart({ data, onSliceClick, activeId }) {
  const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#fb923c', '#4ade80', '#a78bfa'];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--ion-color-medium)', padding: 16 }}>No data to display</div>;
  }

  if (data.length === 1) {
    const segment = data[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <svg viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
          <circle
            cx="50" cy="50" r="45" fill={colors[0]} stroke="white" strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        </svg>
        <div style={{ width: '100%' }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', cursor: 'pointer', background: activeId === segment.id ? '#e0f2fe' : 'transparent', borderRadius: 8, padding: '8px' }}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: colors[0], display: 'inline-block', marginRight: 8 }} />
              <span style={{ fontSize: '0.9rem' }}>{segment.label}</span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{segment.value.toFixed(2)} (100%)</span>
          </div>
          {activeId && (
            <button onClick={() => onSliceClick(null)} style={{ color: '#0ea5e9', fontSize: '0.85rem', background: 'none', border: 'none', textDecoration: 'underline', marginTop: 8, cursor: 'pointer' }}>Clear Filter</button>
          )}
        </div>
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100;
    const startAngle = cumulativePercent * 3.6;
    const endAngle = (cumulativePercent + percent) * 3.6;
    cumulativePercent += percent;

    const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = percent > 50 ? 1 : 0;

    return {
      ...item,
      percent,
      d: `M 50,50 L ${x1},${y1} A 45,45 0 ${largeArcFlag},1 ${x2},${y2} Z`,
      color: colors[index % colors.length],
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 100 100" style={{ width: 140, height: 140, transform: 'rotate(-90deg)' }}>
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.d}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer', opacity: activeId && activeId !== segment.id ? 0.4 : 1 }}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        ))}
      </svg>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 4 }}>
          <span>Projects</span><span>Hours</span>
        </div>
        {segments.map((segment, index) => (
          <div
            key={index}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
              background: activeId === segment.id ? '#e0f2fe' : 'transparent',
              fontWeight: activeId === segment.id ? 600 : 400,
            }}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: segment.color, display: 'inline-block', marginRight: 8, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{segment.label}</span>
            </div>
            <span style={{ flexShrink: 0, marginLeft: 8 }}>{segment.value.toFixed(2)} ({segment.percent.toFixed(0)}%)</span>
          </div>
        ))}
        {activeId && (
          <button onClick={() => onSliceClick(null)} style={{ color: '#0ea5e9', fontSize: '0.85rem', background: 'none', border: 'none', textDecoration: 'underline', marginTop: 8, cursor: 'pointer' }}>Clear Filter</button>
        )}
      </div>
    </div>
  );
}
