import { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { SparklesIcon } from './Icons';
import api from '../api';

export default function TimeEntryForm({ userId, onSaveEntry, onClose, fullDb, initialData }) {
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '17:00:00');
  const [projectId, setProjectId] = useState(initialData?.projectId || '');
  const [subProjectId, setSubProjectId] = useState(initialData?.subProjectId || '');
  const [activityTypeId, setActivityTypeId] = useState(initialData?.activityTypeId || '');
  const [priority, setPriority] = useState(initialData?.priority || 'Medium');
  const [workLocation, setWorkLocation] = useState(initialData?.workLocation || 'Office');
  const [teamMemberIds, setTeamMemberIds] = useState(initialData?.teamMemberIds || []);
  const [description, setDescription] = useState(initialData?.description || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesc, setGeneratedDesc] = useState('');
  const modalRef = useRef();

  const isEditing = initialData && initialData.id;

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setStartTime(initialData.startTime || '09:00:00');
      setEndTime(initialData.endTime || '17:00:00');
      setProjectId(initialData.projectId || '');
      setSubProjectId(initialData.subProjectId || '');
      setActivityTypeId(initialData.activityTypeId || '');
      setPriority(initialData.priority || 'Medium');
      setWorkLocation(initialData.workLocation || 'Office');
      setTeamMemberIds(initialData.teamMemberIds || []);
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const hours = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const pad = (t) => (t.split(':').length === 2 ? t + ':00' : t);
    const start = new Date(`1970-01-01T${pad(startTime)}`);
    const end = new Date(`1970-01-01T${pad(endTime)}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  }, [startTime, endTime]);

  const userProjects = useMemo(() => fullDb.projects.filter((p) => p.createdBy === userId), [fullDb.projects, userId]);
  const userActivityTypes = useMemo(() => fullDb.activityTypes, [fullDb.activityTypes]);
  const userTeamMembers = useMemo(() => fullDb.teamMembers.filter((t) => t.createdBy === userId), [fullDb.teamMembers, userId]);
  const availableSubProjects = useMemo(() => fullDb.subProjects.filter((sp) => sp.projectId === projectId && sp.createdBy === userId), [fullDb.subProjects, projectId, userId]);

  const selectedProject = userProjects.find((p) => p.id === projectId);
  const company = fullDb.companies.find((c) => c.id === selectedProject?.companyId);
  const stakeholder = fullDb.stakeholders.find((s) => s.id === selectedProject?.stakeholderId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hours <= 0 || !activityTypeId || !projectId || !subProjectId) {
      alert('Please fill all required fields (Project, Sub-Project, Activity) and ensure end time is after start time.');
      return;
    }
    onSaveEntry({
      id: isEditing ? initialData.id : undefined,
      userId,
      date,
      startTime,
      endTime,
      hours,
      projectId,
      subProjectId,
      activityTypeId,
      priority,
      workLocation,
      teamMemberIds,
      description,
    });
  };

  const handleGenerateDesc = async () => {
    if (aiPrompt.trim().length < 10) {
      alert('Please provide a bit more detail for the AI to work with.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.generateDescription(aiPrompt);
      setGeneratedDesc(result.description);
    } catch (error) {
      alert(`Failed to generate description: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current === e.target) handleClose();
  };

  const inputClasses = 'mt-1 w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500';
  const readOnlyInputClasses = 'mt-1 w-full p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500';
  const labelClasses = 'block text-sm font-medium text-slate-600';

  return (
    <div ref={modalRef} onClick={handleBackdropClick} className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-full overflow-y-auto transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">{isEditing ? 'Edit' : 'Add New'} Time Entry</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClasses}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClasses} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>Start</label>
                <input type="time" step="1" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>End</label>
                <input type="time" step="1" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Hours</label>
                <input type="text" value={hours.toFixed(2)} readOnly className={readOnlyInputClasses} />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Project</label>
              <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setSubProjectId(''); }} required className={inputClasses}>
                <option value="">Select Project</option>
                {userProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Sub-Project</label>
              <select value={subProjectId} onChange={(e) => setSubProjectId(e.target.value)} required disabled={!projectId} className={`${inputClasses} disabled:bg-slate-100`}>
                <option value="">Select Sub-Project</option>
                {availableSubProjects.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Company</label>
              <input type="text" value={company?.name || ''} readOnly className={readOnlyInputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Stakeholder</label>
              <input type="text" value={stakeholder?.name || ''} readOnly className={readOnlyInputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Activity Type</label>
              <select value={activityTypeId} onChange={(e) => setActivityTypeId(e.target.value)} required className={inputClasses}>
                <option value="">Select Activity</option>
                {userActivityTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClasses}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Location</label>
                <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className={inputClasses}>
                  <option>Office</option>
                  <option>Client</option>
                  <option>Home</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Team Members (Hold Ctrl/Cmd to select multiple)</label>
              <select multiple value={teamMemberIds} onChange={(e) => setTeamMemberIds(Array.from(e.target.selectedOptions, (o) => o.value))} className={`${inputClasses} h-28`}>
                {userTeamMembers.map((tm) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className={labelClasses}>Description</label>
                <button type="button" onClick={() => setIsAiActive(!isAiActive)} className="text-xs flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors font-medium border border-indigo-200">
                  <span className="w-3 h-3"><SparklesIcon /></span> {isAiActive ? 'Hide AI Assist' : 'Fill by AI'}
                </button>
              </div>
              
              {isAiActive && (
                <div className="mb-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-fadeIn">
                  {generatedDesc ? (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-700 bg-white p-3 rounded border border-indigo-100 prose prose-sm prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(generatedDesc) }} />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => handleGenerateDesc()} disabled={isGenerating} className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                          {isGenerating ? 'Generating...' : 'Generate Again'}
                        </button>
                        <button type="button" onClick={() => { setDescription(generatedDesc); setIsAiActive(false); setGeneratedDesc(''); setAiPrompt(''); }} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm">
                          Fill It
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-indigo-800">What did you do? (Provide enough detail for best results)</label>
                      <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3} placeholder="Example: Fixed the responsive layout on the dashboard header..." className={`${inputClasses} border-indigo-200 focus:ring-indigo-400`} />
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${aiPrompt.length < 50 ? 'text-slate-500' : 'text-green-600'}`}>
                          {aiPrompt.length} chars (aim for at least 50-300)
                        </span>
                        <button type="button" onClick={handleGenerateDesc} disabled={isGenerating || aiPrompt.trim().length === 0} className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center gap-1">
                          {isGenerating ? (
                            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
                          ) : (
                            <><span className="w-3 h-3"><SparklesIcon /></span> Submit</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
            </div>
          </div>
          <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t">
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-slate-200 rounded-lg text-sm hover:bg-slate-300 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors">
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
