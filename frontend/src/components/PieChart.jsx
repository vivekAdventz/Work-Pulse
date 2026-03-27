export default function PieChart({ data, onSliceClick, activeId }) {
  const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) return <div className="flex items-center justify-center h-full text-slate-500">No data to display</div>;

  if (data.length === 1) {
    const segment = data[0];
    return (
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-40 h-40 filter drop-shadow-lg">
          <circle
            cx="50" cy="50" r="45" fill={colors[0]} stroke="white" strokeWidth="2"
            className={`cursor-pointer transition-transform duration-300 ${activeId === segment.id ? 'scale-105' : 'scale-100'}`}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        </svg>
        <div className="w-full">
          <div className="flex justify-between font-semibold text-slate-700 mb-2 border-b pb-1">
            <span>Projects</span><span>Hours</span>
          </div>
          <div className={`flex justify-between items-center text-sm p-2 rounded-lg cursor-pointer transition-colors ${activeId === segment.id ? 'bg-sky-100 font-semibold' : ''}`} onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: colors[0] }}></span>
              <span className="truncate" title={segment.label}>{segment.label}</span>
            </div>
            <span className="font-medium text-slate-600">{segment.value.toFixed(2)} (100%)</span>
          </div>
          {activeId && <button onClick={() => onSliceClick(null)} className="text-sm text-sky-600 hover:underline mt-2">Clear Filter</button>}
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
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90 filter drop-shadow-lg">
        {segments.map((segment, index) => (
          <path
            key={index} d={segment.d} fill={segment.color} stroke="white" strokeWidth="2"
            className={`cursor-pointer transition-all duration-300 ${activeId === segment.id ? 'scale-105' : activeId ? 'opacity-40' : 'scale-100'}`}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        ))}
      </svg>
      <div className="w-full">
        <div className="flex justify-between font-semibold text-slate-700 mb-2 border-b pb-1">
          <span>Projects</span><span>Hours</span>
        </div>
        {segments.map((segment, index) => (
          <div key={index} className={`flex justify-between items-center text-sm p-2 rounded-lg cursor-pointer transition-colors ${activeId === segment.id ? 'bg-sky-100 font-semibold' : ''}`} onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: segment.color }}></span>
              <span className="truncate" title={segment.label}>{segment.label}</span>
            </div>
            <span className="font-medium text-slate-600">{segment.value.toFixed(2)} ({segment.percent.toFixed(0)}%)</span>
          </div>
        ))}
        {activeId && <button onClick={() => onSliceClick(null)} className="text-sm text-sky-600 hover:underline mt-2">Clear Filter</button>}
      </div>
    </div>
  );
}
