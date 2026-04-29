import { useState } from 'react';
import { DeleteIcon, EditIcon } from '../common/Icons';
import ProjectModal from './ProjectModal';
import { useConfirm } from '../common/useConfirm';

export default function ProjectConfig({ projects, companies, subProjects, tasks, onSave, onDelete }) {
  const [modalProject, setModalProject] = useState(null);
  const { ConfirmModal, confirm } = useConfirm();

  const handleDelete = async (id, name) => {
    const ok = await confirm(`"${name}" and all its sub-projects and tasks will be permanently deleted.`, { title: 'Delete Project' });
    if (ok) onDelete(id);
  }; // null = closed, 'new' | project object = open

  const isOpen = modalProject !== null;
  const editingProject = modalProject === 'new' ? null : modalProject;

  const handleSave = async (projectData, localSubProjects) => {
    await onSave(projectData, localSubProjects, editingProject?.id ?? null);
    setModalProject(null);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Active Projects</h2>
          <button
            onClick={() => setModalProject('new')}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Add New
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[280px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Project Name</th>
                <th className="px-6 py-4 font-semibold">Companies</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Sub-projects</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((item) => {
                const itemCompanyIds = item.companyIds || (item.companyId ? [item.companyId] : []);
                const itemCompanies = companies.filter(c => itemCompanyIds.includes(c.id));
                const spCount = subProjects.filter(sp => sp.projectId === item.id).length;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {itemCompanies.length > 0
                          ? itemCompanies.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                              {c.name}
                            </span>
                          ))
                          : <span className="text-xs text-slate-400">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm max-w-[200px]">
                      <span className="line-clamp-2">{item.purpose || <span className="italic text-slate-300">No description</span>}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setModalProject(item)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-blue-faint hover:text-brand-blue text-slate-600 text-xs font-semibold transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                        </svg>
                        {spCount} sub-project{spCount !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <button
                        onClick={() => setModalProject(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit project"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete project"
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400 italic">
                    No projects yet. Click "+ Add New" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ConfirmModal}

      {/* Modal */}
      {isOpen && (
        <ProjectModal
          project={editingProject}
          companies={companies}
          subProjects={subProjects}
          tasks={tasks}
          onSave={handleSave}
          onClose={() => setModalProject(null)}
        />
      )}
    </>
  );
}
