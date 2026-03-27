import { useState, useMemo } from 'react';

export default function ProjectSummaryTable({ entries, fullDb }) {
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const summary = useMemo(() => {
    const projectMap = new Map();

    entries.forEach((entry) => {
      if (!projectMap.has(entry.projectId)) {
        projectMap.set(entry.projectId, {
          name: fullDb.projects.find((p) => p.id === entry.projectId)?.name || 'Unknown Project',
          hours: 0,
          subProjects: new Map(),
        });
      }
      const project = projectMap.get(entry.projectId);
      project.hours += entry.hours;

      if (!project.subProjects.has(entry.subProjectId)) {
        project.subProjects.set(entry.subProjectId, {
          name: fullDb.subProjects.find((sp) => sp.id === entry.subProjectId)?.name || 'Unknown Sub-Project',
          hours: 0,
        });
      }
      project.subProjects.get(entry.subProjectId).hours += entry.hours;
    });

    return Array.from(projectMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        hours: data.hours,
        subProjects: Array.from(data.subProjects.values()).sort((a, b) => b.hours - a.hours),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries, fullDb]);

  const toggleProject = (projectId) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) newSet.delete(projectId);
      else newSet.add(projectId);
      return newSet;
    });
  };

  if (summary.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--ion-color-medium)', padding: 16 }}>No summary data available</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {summary.map((project) => (
        <div key={project.id} style={{ background: '#f8fafc', borderRadius: 8 }}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, cursor: 'pointer' }}
            onClick={() => toggleProject(project.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#0ea5e9', transform: expandedProjects.has(project.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>&#9654;</span>
              <span style={{ fontWeight: 600, marginLeft: 8, fontSize: '0.9rem' }}>{project.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#0ea5e9', fontSize: '0.9rem' }}>{project.hours.toFixed(2)}h</span>
          </div>
          {expandedProjects.has(project.id) && (
            <div style={{ paddingLeft: 36, paddingRight: 12, paddingBottom: 12 }}>
              {project.subProjects.map((sp) => (
                <div key={sp.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{sp.name}</span>
                  <span style={{ fontWeight: 500 }}>{sp.hours.toFixed(2)}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
