import TimeEntry from '../models/TimeEntry.js';

import { getTeamUserIds } from '../services/teamService.js';

export const getAll = async (req, res) => {
  if (req.user.roles && req.user.roles.includes('Superadmin')) {
    const entries = await TimeEntry.find();
    return res.json(entries);
  }
  const teamIds = await getTeamUserIds(req.user.userId);
  const entries = await TimeEntry.find({
    $or: [
      { userId: { $in: teamIds } },
      { teamMemberIds: { $in: teamIds } }
    ]
  });
  res.json(entries);
};

function normalizeActivityTypeIds(body) {
  let ids = body.activityTypeIds;
  if ((!ids || !ids.length) && body.activityTypeId) {
    ids = [body.activityTypeId];
  }
  return Array.isArray(ids) ? ids.filter(Boolean) : [];
}

export const create = async (req, res) => {
  const { id, activityTypeId: _legacy, ...rest } = req.body;
  const activityTypeIds = normalizeActivityTypeIds(req.body);
  if (!activityTypeIds.length) {
    return res.status(400).json({ error: 'At least one activity type is required' });
  }
  const entry = await TimeEntry.create({ ...rest, activityTypeIds });
  res.status(201).json(entry);
};

export const update = async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });

  const fields = [
    'date', 'startTime', 'endTime', 'hours', 'description',
    'priority', 'workLocation', 'projectId', 'subProjectIds', 'taskIds',
    'teamMemberIds', 'stakeholderIds',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) entry[field] = req.body[field];
  });
  if (req.body.activityTypeIds !== undefined || req.body.activityTypeId !== undefined) {
    const ids = normalizeActivityTypeIds(req.body);
    if (!ids.length) {
      return res.status(400).json({ error: 'At least one activity type is required' });
    }
    entry.activityTypeIds = ids;
  }

  await entry.save();
  res.json(entry);
};

export const remove = async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });

  const requestUserId = req.user.userId;

  // If entry has team members (real users), soft-delete for this user only
  if (entry.teamMemberIds && entry.teamMemberIds.length > 0) {
    if (!entry.deletedFor) entry.deletedFor = [];
    if (!entry.deletedFor.map(String).includes(String(requestUserId))) {
      entry.deletedFor.push(requestUserId);
    }
    await entry.save();
    return res.json({ message: 'Entry hidden for you' });
  }

  // No team members - actually delete
  await TimeEntry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted successfully' });
};
