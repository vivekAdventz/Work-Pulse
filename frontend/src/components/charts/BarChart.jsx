export default function BarChart({ data }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">No data to display</div>;
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 7);
  const maxValue = sortedData.length > 0 ? Math.max(...sortedData.map((d) => d.value)) : 0;

  return (
    <div className="space-y-4 pt-2">
      {sortedData.map((item) => {
        const barWidthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center group">
            <div className="w-1/3 pr-4 text-right">
              <p className="text-sm font-medium text-slate-700 truncate" title={item.label}>{item.label}</p>
            </div>
            <div className="w-2/3 flex items-center">
              <div className="w-full bg-slate-200 rounded-full h-5 shadow-inner">
                <div className="bg-sky-500 h-5 rounded-full group-hover:bg-sky-600 transition-all duration-300" style={{ width: `${barWidthPercentage}%` }}></div>
              </div>
              <p className="pl-3 text-sm font-semibold text-slate-800 w-20">{item.value.toFixed(2)}h</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
