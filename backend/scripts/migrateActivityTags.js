/**
 * Run after deploying schema changes that add ActivityTag + ActivityType.tagId + User.activityTagIds.
 * Order: pull code → npm install → run this script → start the server.
 * From repo root: npm run migrate:activity-tags (see backend/package.json)
 */
import '../config/env.js';
import { connectDB } from '../config/db.js';
import ActivityTag from '../models/ActivityTag.js';
import ActivityType from '../models/ActivityType.js';
import User from '../models/User.js';

async function run() {
  await connectDB();

  let common = await ActivityTag.findOne({ slug: 'common' });
  if (!common) {
    common = await ActivityTag.create({ name: 'Common', slug: 'common', sortOrder: 0 });
    console.log('Created ActivityTag with slug "common".');
  }

  const types = await ActivityType.updateMany(
    { tagId: { $exists: false } },
    { $set: { tagId: common._id } }
  );
  console.log('ActivityType documents updated (missing tagId):', types.modifiedCount);

  const users = await User.updateMany({}, { $addToSet: { activityTagIds: common._id } });
  console.log('User documents matched for common tag:', users.matchedCount);

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
