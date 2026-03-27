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
  const employeePassword = await bcrypt.hash('employee@123', 10);

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@adventz.com',
    roles: ['Superadmin'],
    password: hashedPassword,
    active: true
  });

  const employees = [
    { name: 'Amit Rungta', email: 'amit.rungta@adventz.com' },
    { name: 'Rahul Sharma', email: 'rahul.sharma@adventz.com' },
    { name: 'Talha Parkar', email: 'talha.parkar@adventz.com' },
    { name: 'Priya Patel', email: 'priya.patel@adventz.com' },
    { name: 'Sanjay Gupta', email: 'sanjay.gupta@adventz.com' },
    { name: 'Neha Verma', email: 'neha.verma@adventz.com' },
  ];

  for (const emp of employees) {
    await User.create({
      name: emp.name,
      email: emp.email,
      roles: ['Employee'],
      password: employeePassword,
      active: true
    });
  }

  console.log('Database seeded with users (password for employees: employee@123, superadmin: admin@123)');
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

// Run directly: node seed.js [--reset]
// No flag or --reset: wipes everything and re-seeds
// --run: only seeds if DB is empty
const args = process.argv.slice(2);
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || args.length > 0) {
  import('./config/db.js').then(async ({ connectDB }) => {
    await connectDB();
    if (args.includes('--run')) {
      await seedDatabase();
    } else {
      await resetAndSeed();
    }
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
