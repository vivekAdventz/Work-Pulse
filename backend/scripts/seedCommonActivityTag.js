/**
 * Ensures the default ActivityTag with slug `common` exists.
 * Run from backend: npm run seed:common-activity-tag
 */
import '../config/env.js';
import { connectDB } from '../config/db.js';
import ActivityTag from '../models/ActivityTag.js';

export async function ensureCommonActivityTag() {
  const existing = await ActivityTag.findOne({ slug: 'common' });
  if (existing) {
    console.log('ActivityTag "common" already exists. Skipping.');
    return existing;
  }
  const created = await ActivityTag.create({
    name: 'Common',
    slug: 'common',
    sortOrder: 0,
  });
  console.log('Created default ActivityTag "common".');
  return created;
}

async function main() {
  await connectDB();
  await ensureCommonActivityTag();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
