import ActivityTag from '../models/ActivityTag.js';
import User from '../models/User.js';

/** Whether GET /activityTypes (and AI prompts) should restrict to the user’s activity tags. */
export function shouldFilterActivityTypes(req) {
  const roles = req.user?.roles || [];
  if (roles.includes('Superadmin')) return false;
  if (!roles.includes('Employee')) return false;
  const active = (req.headers['x-active-role'] || '').trim();
  if (roles.includes('Manager')) {
    return active !== 'Manager';
  }
  return true;
}

/**
 * Mongoose query for ActivityType.find (empty = all visible to this user context).
 */
export async function getActivityTypeQuery(req) {
  if (!shouldFilterActivityTypes(req)) return {};
  const user = await User.findById(req.user.userId).select('activityTagIds').lean();
  let ids = (user?.activityTagIds || []).map((id) => id.toString());
  if (!ids.length) {
    const common = await ActivityTag.findOne({ slug: 'common' }).select('_id').lean();
    if (common) ids = [common._id.toString()];
  }
  if (!ids.length) return { _id: { $in: [] } };
  return { tagId: { $in: ids } };
}
