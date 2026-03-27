import User from '../models/User.js';
import TimeEntry from '../models/TimeEntry.js';
import Company from '../models/Company.js';
import Stakeholder from '../models/Stakeholder.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import ActivityType from '../models/ActivityType.js';
import TeamMember from '../models/TeamMember.js';

export const getAllData = async (req, res) => {
  const [users, timeEntries, companies, stakeholders, projects, subProjects, activityTypes, teamMembers] =
    await Promise.all([
      User.find(),
      TimeEntry.find(),
      Company.find(),
      Stakeholder.find(),
      Project.find(),
      SubProject.find(),
      ActivityType.find(),
      TeamMember.find(),
    ]);

  res.json({ users, timeEntries, companies, stakeholders, projects, subProjects, activityTypes, teamMembers });
};
