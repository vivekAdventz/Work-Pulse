import ActivityTag from '../models/ActivityTag.js';
import ActivityType from '../models/ActivityType.js';

export const list = async (req, res) => {
  const tags = await ActivityTag.find().sort({ sortOrder: 1, name: 1 });
  res.json(tags);
};

export const create = async (req, res) => {
  const { name, slug, sortOrder } = req.body;
  if (!name?.trim() || !slug?.trim()) {
    return res.status(400).json({ error: 'name and slug are required' });
  }
  const tag = await ActivityTag.create({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    sortOrder: sortOrder ?? 0,
  });
  res.status(201).json(tag);
};

export const update = async (req, res) => {
  const tag = await ActivityTag.findById(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Not found' });
  if (req.body.name !== undefined) tag.name = req.body.name.trim();
  if (req.body.slug !== undefined && tag.slug !== 'common') {
    tag.slug = req.body.slug.trim().toLowerCase();
  }
  if (req.body.sortOrder !== undefined) tag.sortOrder = req.body.sortOrder;
  await tag.save();
  res.json(tag);
};

export const remove = async (req, res) => {
  const tag = await ActivityTag.findById(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Not found' });
  if (tag.slug === 'common') {
    return res.status(400).json({ error: 'Cannot delete the common tag' });
  }
  const inUse = await ActivityType.countDocuments({ tagId: tag._id });
  if (inUse > 0) {
    return res.status(400).json({ error: 'Reassign or delete activity types using this tag first' });
  }
  await ActivityTag.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted successfully' });
};
