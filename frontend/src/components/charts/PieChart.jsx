export default function PieChart({ data, onSliceClick, activeId }) {
  const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 opacity-60">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-slate-200">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-xs font-medium text-slate-400">No data for this duration</p>
      </div>
    );
  }

  if (data.length === 1) {
    const segment = data[0];
    return (
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0 filter drop-shadow-lg">
          <circle
            cx="50" cy="50" r="45" fill={colors[0]} stroke="white" strokeWidth="2"
            className={`cursor-pointer transition-transform duration-300 ${activeId === segment.id ? 'scale-105' : 'scale-100'}`}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        </svg>
        <div className="w-full">
          <div className="flex justify-between font-semibold text-slate-700 text-xs mb-1.5 border-b pb-1">
            <span>Projects</span><span>Hours</span>
          </div>
          <div className={`flex justify-between items-center text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${activeId === segment.id ? 'bg-sky-100 font-semibold' : ''}`} onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}>
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: colors[0] }}></span>
              <span className="truncate text-xs" title={segment.label}>{segment.label}</span>
            </div>
            <span className="font-medium text-slate-600 text-xs whitespace-nowrap ml-2">{segment.value.toFixed(2)} (100%)</span>
          </div>
          {activeId && <button onClick={() => onSliceClick(null)} className="text-xs text-sky-600 hover:underline mt-1.5">Clear Filter</button>}
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
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0 transform -rotate-90 filter drop-shadow-lg">
        {segments.map((segment, index) => (
          <path
            key={index} d={segment.d} fill={segment.color} stroke="white" strokeWidth="2"
            className={`cursor-pointer transition-all duration-300 ${activeId === segment.id ? 'scale-105' : activeId ? 'opacity-40' : 'scale-100'}`}
            onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}
          />
        ))}
      </svg>
      <div className="w-full">
        <div className="flex justify-between font-semibold text-slate-700 text-xs mb-1.5 border-b pb-1">
          <span>Projects</span><span>Hours</span>
        </div>
        <div className={segments.length > 6 ? 'max-h-[144px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full' : ''}>
          {segments.map((segment, index) => (
            <div key={index} className={`flex justify-between items-center text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${activeId === segment.id ? 'bg-sky-100 font-semibold' : ''}`} onClick={() => onSliceClick(activeId === segment.id ? null : segment.id)}>
              <div className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: segment.color }}></span>
                <span className="truncate text-xs" title={segment.label}>{segment.label}</span>
              </div>
              <span className="font-medium text-slate-600 text-xs whitespace-nowrap ml-2">{segment.value.toFixed(2)} ({segment.percent.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
        {activeId && <button onClick={() => onSliceClick(null)} className="text-xs text-sky-600 hover:underline mt-1.5">Clear Filter</button>}
      </div>
    </div>
  );
}
