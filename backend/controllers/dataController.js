import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import Company from '../models/Company.js';
import Stakeholder from '../models/Stakeholder.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import ActivityType from '../models/ActivityType.js';
import TeamMember from '../models/TeamMember.js';
import { getTeamUserIds } from '../services/teamService.js';
import { getActivityTypeQuery } from '../services/activityVisibilityService.js';

export const getAllData = async (req, res) => {
  const isSuperadmin = req.user.roles && req.user.roles.includes('Superadmin');
  const teamIds = isSuperadmin ? null : await getTeamUserIds(req.user.userId);
  
  const scopeFilter = isSuperadmin ? {} : { createdBy: { $in: teamIds } };
  const userFilter = isSuperadmin ? {} : { _id: { $in: teamIds } };
  const timeEntryFilter = isSuperadmin ? {} : {
    $or: [
      { userId: { $in: teamIds } },
      { teamMemberIds: { $in: teamIds } }
    ]
  };

  const actQuery = await getActivityTypeQuery(req);
  const [users, timeEntries, companies, stakeholders, projects, subProjects, activityTypes, teamMembers] =
    await Promise.all([
      User.find(userFilter),
      TimeEntry.find(timeEntryFilter),
      Company.find(scopeFilter),
      Stakeholder.find(scopeFilter),
      Project.find(scopeFilter),
      SubProject.find(scopeFilter),
      ActivityType.find(actQuery).populate('tagId', 'name slug sortOrder'),
      TeamMember.find(scopeFilter),
    ]);

  res.json({ users, timeEntries, companies, stakeholders, projects, subProjects, activityTypes, teamMembers });
};
