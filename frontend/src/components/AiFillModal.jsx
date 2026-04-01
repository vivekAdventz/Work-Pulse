import { useState } from 'react';
import api from '../api';
import { AiWandIcon, PlusIcon, DeleteIcon } from './Icons';

const STEPS = { PROMPT: 'prompt', REVIEW: 'review', SAVING: 'saving' };

export default function AiFillModal({ existingProjects, companies, stakeholders, user, onClose, onSave }) {
  const [step, setStep] = useState(STEPS.PROMPT);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable review fields
  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [yourRole, setYourRole] = useState('');
  const [stakeholderName, setStakeholderName] = useState('');
  const [subProjects, setSubProjects] = useState([]);
  const [newSubProject, setNewSubProject] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const config = await api.fillByAI(prompt);
      // Validate uniqueness
      const isDuplicate = existingProjects.some(
        (p) => p.name.toLowerCase() === config.projectName?.toLowerCase()
      );
      if (isDuplicate) {
        config.projectName = config.projectName + ' (2)';
      }
      setProjectName(config.projectName || '');
      setCompanyName(config.companyName || '');
      setPurpose(config.purpose || '');
      setYourRole(config.yourRole || '');
      setStakeholderName(config.stakeholderName || '');
      setSubProjects(Array.isArray(config.subProjects) ? config.subProjects : []);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message || 'Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSubProject = () => {
    if (newSubProject.trim()) {
      setSubProjects((prev) => [...prev, newSubProject.trim()]);
      setNewSubProject('');
    }
  };

  const removeSubProject = (idx) => {
    setSubProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Project name is required.');
      return;
    }
    const isDuplicate = existingProjects.some(
      (p) => p.name.toLowerCase() === projectName.trim().toLowerCase()
    );
    if (isDuplicate) {
      setError('Project name already exists. Please choose a unique name.');
      return;
    }
    setStep(STEPS.SAVING);
    setError('');
    try {
      await onSave({
        projectName: projectName.trim(),
        companyName: companyName.trim(),
        purpose: purpose.trim(),
        yourRole: yourRole.trim(),
        stakeholderName: stakeholderName.trim(),
        subProjects,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setStep(STEPS.REVIEW);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl">
            <AiWandIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Fill by AI</h2>
            <p className="text-violet-200 text-sm">
              {step === STEPS.PROMPT
                ? 'Describe your project and let AI configure it'
                : step === STEPS.REVIEW
                ? 'Review and edit the AI-generated configuration'
                : 'Saving your project configuration…'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-white/70 hover:text-white transition-colors text-2xl leading-none"
            disabled={step === STEPS.SAVING}
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* ── STEP 1: Prompt ────────────────────────────── */}
          {step === STEPS.PROMPT && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Describe your project
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate(); }}
                  rows={5}
                  placeholder={`e.g. "I'm working on a mobile app for Adventz Group to automate employee attendance. The main stakeholder is the HR Director and I'm the lead developer. Key phases include UI design, backend API, testing and deployment."`}
                  className="w-full p-4 border-2 border-slate-200 focus:border-violet-400 rounded-xl text-sm text-slate-700 placeholder-slate-400 resize-none outline-none transition-colors"
                />
                <p className="mt-1 text-xs text-slate-400">Tip: Press Ctrl+Enter to generate</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <span>⚠</span> {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <AiWandIcon /> Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review ────────────────────────────── */}
          {step === STEPS.REVIEW && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm text-slate-800 outline-none transition-colors"
                    placeholder="Project name"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm text-slate-800 outline-none transition-colors"
                    placeholder="Company / client name"
                  />
                </div>

                {/* Your Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Your Role
                  </label>
                  <input
                    type="text"
                    value={yourRole}
                    onChange={(e) => setYourRole(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm text-slate-800 outline-none transition-colors"
                    placeholder="e.g. Lead Developer"
                  />
                </div>

                {/* Stakeholder Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Stakeholder Name
                  </label>
                  <input
                    type="text"
                    value={stakeholderName}
                    onChange={(e) => setStakeholderName(e.target.value)}
                    className="w-full p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm text-slate-800 outline-none transition-colors"
                    placeholder="Key stakeholder / sponsor"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Purpose
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm text-slate-800 outline-none resize-none transition-colors"
                  placeholder="Project objective / purpose"
                />
              </div>

              {/* Sub-Projects */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Sub-Projects
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subProjects.map((sp, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium rounded-full"
                    >
                      {sp}
                      <button
                        onClick={() => removeSubProject(idx)}
                        className="text-violet-400 hover:text-red-500 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {subProjects.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No sub-projects yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubProject}
                    onChange={(e) => setNewSubProject(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubProject(); } }}
                    className="flex-1 p-2.5 border-2 border-slate-200 focus:border-violet-400 rounded-lg text-sm outline-none transition-colors"
                    placeholder="Add a sub-project…"
                  />
                  <button
                    onClick={addSubProject}
                    className="px-3 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg transition-colors"
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <span>⚠</span> {error}
                </div>
              )}

              <div className="flex gap-3 justify-between pt-2">
                <button
                  onClick={() => { setStep(STEPS.PROMPT); setError(''); }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  ← Re-generate
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all"
                >
                  ✓ Create Project
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Saving ────────────────────────────── */}
          {step === STEPS.SAVING && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <svg className="animate-spin h-12 w-12 text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-slate-600 font-medium">Creating company, project &amp; sub-projects…</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp { animation: slideUp 0.25s ease-out both; }
      `}</style>
    </div>
  );
}
