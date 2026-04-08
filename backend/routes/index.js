import { Router } from 'express';

import authRoutes from './auth.js';
import userRoutes from './users.js';

import timeEntryRoutes from './timeEntries.js';
import aiRoutes from './ai.js';
import taskKeepRoutes from './taskKeep.js';
import { createCrudRouter } from './crud.js';
import { authenticate } from '../middleware/auth.js';
import { getTeamUserIds } from '../services/teamService.js';

import Company from '../models/Company.js';
import Stakeholder from '../models/Stakeholder.js';
import ActivityType from '../models/ActivityType.js';
import TeamMember from '../models/TeamMember.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';

const router = Router();

// Public auth routes (no token required)
router.use('/', authRoutes);

// All routes below require JWT authentication
router.use(authenticate);

// Feature routes
router.use('/users', userRoutes);

router.use('/timeEntries', timeEntryRoutes);
router.use('/', aiRoutes);
router.use('/taskKeep', taskKeepRoutes);

// Filter factory for items created within user's team
const teamScopeFilter = async (req) => {
  // If Superadmin, return empty query (fetch all)
  if (req.user.roles && req.user.roles.includes('Superadmin')) return {};
  const teamIds = await getTeamUserIds(req.user.userId);
  return { createdBy: { $in: teamIds } };
};

// Generic CRUD routes scoped to team
router.use('/companies', createCrudRouter(Company, teamScopeFilter));
router.use('/stakeholders', createCrudRouter(Stakeholder, teamScopeFilter));
router.use('/activityTypes', createCrudRouter(ActivityType, async (req) => {
  if (req.user.roles && req.user.roles.includes('Superadmin')) return {};
  // Activity types might be global or team-scoped depending on business logic. 
  // Let's assume they are team-scoped where needed or fetch all if not scoped.
  // Original EmployeeView didn't filter activityTypes by teamIds: `const userActivityTypes = useMemo(() => fullDb.activityTypes || [],...);`
  // So we return everything for activityTypes.
  return {};
}));
router.use('/teamMembers', createCrudRouter(TeamMember, teamScopeFilter));
router.use('/projects', createCrudRouter(Project, teamScopeFilter));
router.use('/subProjects', createCrudRouter(SubProject, teamScopeFilter));

export default router;
