import { EditIcon, DeleteIcon, EmptyIcon } from './Icons';

export default function TimeEntryList({ entries, allUsers, fullDb, onDeleteEntry, onEditEntry, readOnly = false }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-lg">
        <EmptyIcon />
        <h3 className="mt-2 text-lg font-medium text-slate-800">No time entries found</h3>
        <p className="mt-1 text-sm text-slate-500">There are no entries that match the selected criteria.</p>
      </div>
    );
  }

  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));
  const projectMap = new Map(fullDb.projects.map((p) => [p.id, p.name]));
  const subProjectMap = new Map(fullDb.subProjects.map((sp) => [sp.id, sp.name]));
  const activityMap = new Map(fullDb.activityTypes.map((a) => [a.id, a.name]));

  const headers = ['Date', readOnly ? 'Employee' : null, 'Project', 'Sub-Project', 'Activity', 'Hours', 'Start', 'End', 'Location', 'Priority', 'Description'].filter(Boolean);
  if (!readOnly) headers.push('Actions');

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-sky-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.date}</td>
              {readOnly && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{userMap.get(entry.userId) || 'Unknown'}</td>}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{projectMap.get(entry.projectId) || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{subProjectMap.get(entry.subProjectId) || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{activityMap.get(entry.activityTypeId) || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-600">{entry.hours.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.startTime}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.endTime}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.workLocation}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{entry.priority}</td>
              <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={entry.description}>{entry.description}</td>
              {!readOnly && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                  <button onClick={() => onEditEntry(entry)} className="text-slate-500 hover:text-sky-600 p-1 transition-colors" aria-label="Edit entry">
                    <EditIcon />
                  </button>
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-500 hover:text-red-600 p-1 transition-colors" aria-label="Delete entry">
                    <DeleteIcon />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
