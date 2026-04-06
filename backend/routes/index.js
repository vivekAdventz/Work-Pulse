import { Router } from 'express';

import authRoutes from './auth.js';
import userRoutes from './users.js';
import dataRoutes from './data.js';
import timeEntryRoutes from './timeEntries.js';
import aiRoutes from './ai.js';
import taskKeepRoutes from './taskKeep.js';
import { createCrudRouter } from './crud.js';
import { authenticate } from '../middleware/auth.js';

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
router.use('/', dataRoutes);
router.use('/timeEntries', timeEntryRoutes);
router.use('/', aiRoutes);
router.use('/taskKeep', taskKeepRoutes);

// Generic CRUD routes
router.use('/companies', createCrudRouter(Company));
router.use('/stakeholders', createCrudRouter(Stakeholder));
router.use('/activityTypes', createCrudRouter(ActivityType));
router.use('/teamMembers', createCrudRouter(TeamMember));
router.use('/projects', createCrudRouter(Project));
router.use('/subProjects', createCrudRouter(SubProject));

export default router;
