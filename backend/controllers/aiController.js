import { generateSummary as aiGenerateSummary, generateDescription as aiGenerateDescription, generateProjectConfig as aiGenerateProjectConfig, fillEntryByAI as aiFillEntryByAI } from '../services/aiService.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import ActivityType from '../models/ActivityType.js';
import Task from '../models/Task.js';
import TeamMember from '../models/TeamMember.js';
import { getActivityTypeQuery } from '../services/activityVisibilityService.js';

export const generateSummary = async (req, res) => {
  const { timeEntries, fullDb, reportType } = req.body;
  const summary = await aiGenerateSummary(timeEntries, fullDb, reportType || 'employee');
  res.json({ summary });
};

export const generateDescription = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const description = await aiGenerateDescription(prompt);
  res.json({ description });
};

const getTeamUserIds = async (userId) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) return [userId];

  const managerId = currentUser.reportsTo || currentUser._id;
  const teamMembers = await User.find({
    $or: [
      { _id: managerId },
      { reportsTo: managerId },
      { reportsTo: currentUser._id }
    ]
  }).select('_id');

  return [...new Set([userId, ...teamMembers.map(u => u._id.toString())])];
};

export const fillByAI = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  const userId = req.user?.userId;
  const teamUserIds = await getTeamUserIds(userId);

  const existingProjects = await Project.find({ createdBy: { $in: teamUserIds } }).lean();
  const existingProjectNames = existingProjects.map((p) => p.name);

  const config = await aiGenerateProjectConfig(prompt, existingProjectNames);
  res.json(config);
};

export const fillEntryByAI = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (prompt.trim().length < 100 || prompt.trim().length > 300) {
    return res.status(400).json({ error: 'Prompt must be between 100 and 300 characters.' });
  }
  const userId = req.user?.userId;
  const teamUserIds = await getTeamUserIds(userId);

  const projects = await Project.find({ createdBy: { $in: teamUserIds } }).lean().then(list =>
    list.map(p => ({ id: p._id.toString(), name: p.name }))
  );
  const subProjects = await SubProject.find({ createdBy: { $in: teamUserIds } }).lean().then(list =>
    list.map(sp => ({ id: sp._id.toString(), name: sp.name, projectId: sp.projectId?.toString() }))
  );
  const actQuery = await getActivityTypeQuery(req);
  const activityTypes = await ActivityType.find(actQuery).lean().then((list) =>
    list.map((a) => ({ id: a._id.toString(), name: a.name }))
  );
  const tasks = await Task.find({ createdBy: { $in: teamUserIds } }).lean().then((list) =>
    list.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      subProjectId: t.subProjectId?.toString(),
    }))
  );

  // Fetch team members (real users and custom)
  const realUsers = await User.find({ _id: { $in: teamUserIds }, _id: { $ne: userId } }).lean().then(list =>
    list.map(u => ({ id: u._id.toString(), name: u.name, isRealUser: true }))
  );
  const customMembers = await TeamMember.find({ createdBy: { $in: teamUserIds } }).lean().then(list =>
    list.map(m => ({ id: m._id.toString(), name: m.name }))
  );
  const teamMembers = [...realUsers, ...customMembers];

  const result = await aiFillEntryByAI(prompt, projects, subProjects, activityTypes, teamMembers, tasks);
  res.json(result);
};

export const downloadCsv = (req, res) => {
  const { entries } = req.body;
  if (!entries || entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided' });
  }

  const headers = Object.keys(entries[0]);
  const csvRows = [headers.join(',')];

  for (const entry of entries) {
    const values = headers.map((h) => {
      const val = String(entry[h] ?? '').replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(','));
  }

  res.setHeader('Content-Disposition', 'attachment; filename=timesheet.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csvRows.join('\n'));
};
