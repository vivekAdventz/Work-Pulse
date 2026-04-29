import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ActivityTag from '../models/ActivityTag.js';

async function ensureCommonTagId() {
  let common = await ActivityTag.findOne({ slug: 'common' });
  if (!common) {
    common = await ActivityTag.create({ name: 'Common', slug: 'common', sortOrder: 0 });
  }
  return common._id;
}
import TimeEntry from '../models/TimeEntry.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import ActivityType from '../models/ActivityType.js';
import TeamMember from '../models/TeamMember.js';
import Company from '../models/Company.js';
import Stakeholder from '../models/Stakeholder.js';

import { getTeamUserIds } from '../services/teamService.js';

export const getHierarchy = async (req, res) => {
  const managerId = req.params.id;
  const allUsers = await User.find({ active: true });

  const levels = {};
  let currentParentIds = [managerId];
  let level = 1;
  const maxDepth = 10;

  while (level <= maxDepth) {
    const levelUsers = allUsers.filter(u =>
      currentParentIds.includes(u.reportsTo?.toString())
    );
    if (levelUsers.length === 0) break;
    levels[level] = levelUsers;
    currentParentIds = levelUsers.map(u => u._id.toString());
    level++;
  }

  res.json({ managerId, levels, maxLevel: level - 1 });
};

export const getAll = async (req, res) => {
  if (req.user.roles && req.user.roles.includes('Superadmin')) {
    const users = await User.find().populate('activityTagIds', 'name slug');
    return res.json(users);
  }
  const teamIds = await getTeamUserIds(req.user.userId);
  const users = await User.find({ _id: { $in: teamIds } });
  res.json(users);
};

export const create = async (req, res) => {
  const { name, email, roles, active, reportsTo, activityTagIds } = req.body;
  const hashedPassword = await bcrypt.hash('Welcome@1234', 10);

  let tagIds = Array.isArray(activityTagIds) ? activityTagIds : [];
  if (roles?.includes('Employee') && tagIds.length === 0) {
    tagIds = [await ensureCommonTagId()];
  }

  const user = await User.create({
    name,
    email,
    roles,
    password: hashedPassword,
    active: active !== undefined ? active : true,
    reportsTo: reportsTo || null,
    activityTagIds: tagIds,
  });
  const populated = await User.findById(user._id).populate('activityTagIds', 'name slug');
  res.status(201).json(populated);
};

export const update = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, roles, active, reportsTo, activityTagIds } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (roles !== undefined) user.roles = roles;
  if (active !== undefined) user.active = active;
  if (reportsTo !== undefined) user.reportsTo = reportsTo || null;
  if (activityTagIds !== undefined) user.activityTagIds = Array.isArray(activityTagIds) ? activityTagIds : [];

  await user.save();
  const populated = await User.findById(user._id).populate('activityTagIds', 'name slug');
  res.json(populated);
};

export const remove = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userId = req.params.id;
  await Promise.all([
    TimeEntry.deleteMany({ userId }),
    SubProject.deleteMany({ createdBy: userId }),
    Project.deleteMany({ createdBy: userId }),
    ActivityType.deleteMany({ createdBy: userId }),
    TeamMember.deleteMany({ createdBy: userId }),
    Company.deleteMany({ createdBy: userId }),
    Stakeholder.deleteMany({ createdBy: userId }),
    User.updateMany({ reportsTo: userId }, { $set: { reportsTo: null } }),
  ]);

  res.json({ message: 'Deleted successfully' });
};
