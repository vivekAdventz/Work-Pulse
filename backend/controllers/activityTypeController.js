import ActivityTag from '../models/ActivityTag.js';
import ActivityType from '../models/ActivityType.js';
import * as crud from './crudController.js';
import { getActivityTypeQuery } from '../services/activityVisibilityService.js';

async function validateTagId(tagId) {
  if (!tagId) return { error: 'tagId is required' };
  const tag = await ActivityTag.findById(tagId);
  if (!tag) return { error: 'Invalid tagId' };
  return { tag };
}

export const list = async (req, res) => {
  const query = await getActivityTypeQuery(req);
  const items = await ActivityType.find(query)
    .populate('tagId', 'name slug sortOrder')
    .sort({ name: 1 });
  res.json(items);
};

export const create = async (req, res) => {
  const { name, tagId } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  const v = await validateTagId(tagId);
  if (v.error) return res.status(400).json({ error: v.error });
  const item = await ActivityType.create({
    name: name.trim(),
    tagId,
    createdBy: req.user.userId,
  });
  const populated = await ActivityType.findById(item._id).populate('tagId', 'name slug sortOrder');
  res.status(201).json(populated);
};

export const update = async (req, res) => {
  const item = await ActivityType.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  Object.keys(req.body).forEach((key) => {
    if (['id', '_id', '__v', 'createdBy', 'tagId'].includes(key)) return;
    if (req.body[key] !== undefined) item[key] = req.body[key];
  });
  if (req.body.name !== undefined) item.name = String(req.body.name).trim();
  if (req.body.tagId !== undefined) {
    const v = await validateTagId(req.body.tagId);
    if (v.error) return res.status(400).json({ error: v.error });
    item.tagId = req.body.tagId;
  }

  await item.save();
  const populated = await ActivityType.findById(item._id).populate('tagId', 'name slug sortOrder');
  res.json(populated);
};

export const remove = crud.remove(ActivityType);
