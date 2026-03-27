import bcrypt from 'bcryptjs';
import User from './models/User.js';
import TimeEntry from './models/TimeEntry.js';
import Project from './models/Project.js';
import SubProject from './models/SubProject.js';
import ActivityType from './models/ActivityType.js';
import TeamMember from './models/TeamMember.js';
import Company from './models/Company.js';
import Stakeholder from './models/Stakeholder.js';

export async function seedDatabase() {
  const count = await User.countDocuments();
  if (count > 0) return;

  console.log('Database is empty. Seeding initial users...');

  const hashedPassword = await bcrypt.hash('admin@123', 10);

  await User.create({
    name: 'Super Admin',
    email: 'superadmin@workpulse.com',
    roles: ['Superadmin'],
    password: hashedPassword,
    active: true
  });

  console.log('Database seeded with superadmin (email: superadmin@workpulse.com, password: admin@123)');
}

// Wipe all users and their related data, then re-seed
export async function resetAndSeed() {
  console.log('Removing all users and their related data...');

  const userIds = (await User.find({}, '_id')).map(u => u._id);

  await Promise.all([
    TimeEntry.deleteMany({ userId: { $in: userIds } }),
    SubProject.deleteMany({ createdBy: { $in: userIds } }),
    Project.deleteMany({ createdBy: { $in: userIds } }),
    ActivityType.deleteMany({ createdBy: { $in: userIds } }),
    TeamMember.deleteMany({ createdBy: { $in: userIds } }),
    Company.deleteMany({ createdBy: { $in: userIds } }),
    Stakeholder.deleteMany({ createdBy: { $in: userIds } }),
    User.deleteMany({}),
  ]);

  console.log('All data cleared.');
  await seedDatabase();
}


