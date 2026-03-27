export default function BarChart({ data }) {
  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--ion-color-medium)', padding: 16 }}>No data to display</div>;
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 7);
  const maxValue = sortedData.length > 0 ? Math.max(...sortedData.map((d) => d.value)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
      {sortedData.map((item) => {
        const barWidthPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '35%', paddingRight: 8, textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.label}>{item.label}</p>
            </div>
            <div style={{ width: '65%', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 10, height: 20, overflow: 'hidden' }}>
                <div style={{ background: '#0ea5e9', height: '100%', borderRadius: 10, width: `${barWidthPercentage}%`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, paddingLeft: 8, width: 60, flexShrink: 0 }}>{item.value.toFixed(2)}h</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
