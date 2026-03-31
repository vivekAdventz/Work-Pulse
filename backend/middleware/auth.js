import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign(
    { userId: user._id, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
