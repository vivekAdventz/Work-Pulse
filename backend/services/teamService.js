import User from '../models/User.js';

export async function getTeamUserIds(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return [userId];

  const allUsers = await User.find({ active: true }).lean();
  
  const managerId = user.reportsTo ? user.reportsTo.toString() : userId.toString();
  
  const siblings = allUsers.filter(u => 
    (u.reportsTo && u.reportsTo.toString() === managerId) || u._id.toString() === managerId
  );
  
  const directReports = allUsers.filter(u => 
    u.reportsTo && u.reportsTo.toString() === userId.toString()
  );

  const ids = new Set([
    userId.toString(),
    managerId,
    ...siblings.map(u => u._id.toString()),
    ...directReports.map(u => u._id.toString())
  ]);

  return Array.from(ids);
}
