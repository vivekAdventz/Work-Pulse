export function requireSuperadmin(req, res, next) {
  if (req.user?.roles?.includes('Superadmin')) return next();
  return res.status(403).json({ error: 'Superadmin only' });
}
