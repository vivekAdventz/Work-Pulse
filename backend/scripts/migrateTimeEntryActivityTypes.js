/**
 * Migrates legacy activityTypeId (single) to activityTypeIds (array).
 * Run from backend: npm run migrate:time-entry-activities
 */
import '../config/env.js';
import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';

async function run() {
  await connectDB();
  const col = mongoose.connection.collection('timeentries');
  let updated = 0;
  const cursor = col.find({
    $or: [{ activityTypeId: { $exists: true, $ne: null } }, { activityTypeIds: { $exists: false } }],
  });

  for await (const doc of cursor) {
    const legacy = doc.activityTypeId;
    const existing = doc.activityTypeIds;
    let next =
      Array.isArray(existing) && existing.length ? existing : legacy ? [legacy] : [];
    if (!next.length) continue;

    await col.updateOne(
      { _id: doc._id },
      { $set: { activityTypeIds: next }, $unset: { activityTypeId: '' } }
    );
    updated++;
  }

  console.log(`Migrated ${updated} time entry document(s).`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
