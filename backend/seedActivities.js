import User from './models/User.js';
import ActivityType from './models/ActivityType.js';

const activities = [
  'Meeting / Discussion',
  'Email / Communication',
  'Documentation / Reporting',
  'Development / Coding',
  'Code Review',
  'Testing / QA',
  'Planning / Strategy',
  'Research / Analysis',
  'Training / Learning',
  'Client Interaction',
  'Presentation / Demo',
  'Administrative Work',
  'Break / Downtime',
];

async function seedActivities() {
  const admin = await User.findOne({ roles: 'Superadmin' });
  if (!admin) {
    console.error('No Superadmin user found. Run seed.js first.');
    process.exit(1);
  }

  let added = 0;
  for (const name of activities) {
    const exists = await ActivityType.findOne({ name });
    if (!exists) {
      await ActivityType.create({ name, createdBy: admin._id });
      added++;
    }
  }

  console.log(`Done. ${added} activity types added (${activities.length - added} already existed).`);
}

import('./config/db.js').then(async ({ connectDB }) => {
  await connectDB();
  await seedActivities();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
