import TimeEntry from '../models/TimeEntry.js';

export const getAll = async (req, res) => {
  const entries = await TimeEntry.find();
  res.json(entries);
};

export const create = async (req, res) => {
  const { id, ...data } = req.body;
  const entry = await TimeEntry.create(data);
  res.status(201).json(entry);
};

export const update = async (req, res) => {
  const entry = await TimeEntry.findById(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });

  const fields = [
    'date', 'startTime', 'endTime', 'hours', 'description',
    'priority', 'workLocation', 'projectId', 'subProjectId',
    'activityTypeId', 'teamMemberIds',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) entry[field] = req.body[field];
  });

  await entry.save();
  res.json(entry);
};

export const remove = async (req, res) => {
  const entry = await TimeEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Time entry not found' });
  res.json({ message: 'Deleted successfully' });
};
