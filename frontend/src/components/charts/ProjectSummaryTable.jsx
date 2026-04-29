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

      const spKey = (entry.subProjectIds || (entry.subProjectId ? [entry.subProjectId] : [])).sort().join(',') || 'none';
      if (!project.subProjects.has(spKey)) {
        const names = (entry.subProjectIds || (entry.subProjectId ? [entry.subProjectId] : [])).map(id => fullDb.subProjects.find(sp => sp.id === id)?.name).filter(Boolean);
        project.subProjects.set(spKey, {
          name: names.length > 0 ? names.join(', ') : 'Unknown Sub-Project',
          hours: 0,
        });
      }
      project.subProjects.get(spKey).hours += entry.hours;
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

  if (summary.length === 0) return <div className="flex items-center justify-center h-full text-slate-500">No summary data available</div>;

  return (
    <div className="space-y-2">
      {summary.map((project) => (
        <div key={project.id} className="bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => toggleProject(project.id)}>
            <div className="flex items-center">
              <span className={`transform transition-transform text-sky-600 ${expandedProjects.has(project.id) ? 'rotate-90' : ''}`}>&#9654;</span>
              <span className="font-semibold ml-3 text-slate-800">{project.name}</span>
            </div>
            <span className="font-bold text-sky-600">{project.hours.toFixed(2)}h</span>
          </div>
          {expandedProjects.has(project.id) && (
            <div className="pl-12 pr-4 pb-3">
              {project.subProjects.map((sp) => (
                <div key={sp.name} className="flex justify-between text-sm py-1 border-t border-slate-200">
                  <span className="text-slate-600">{sp.name}</span>
                  <span className="text-slate-800 font-medium">{sp.hours.toFixed(2)}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
