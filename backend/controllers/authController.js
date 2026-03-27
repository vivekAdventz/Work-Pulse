import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  delete obj.__v;
  obj.id = obj._id;
  return obj;
}

// Microsoft SSO login — frontend sends MS access token, backend verifies via MS Graph
export const microsoftLogin = async (req, res) => {
  const { msAccessToken } = req.body;
  if (!msAccessToken) return res.status(400).json({ error: 'Microsoft access token is required' });

  // Verify the MS token by calling Microsoft Graph API
  const msResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${msAccessToken}` }
  });
  if (!msResponse.ok) return res.status(401).json({ error: 'Invalid Microsoft token' });

  const msUser = await msResponse.json();
  const email = msUser.mail || msUser.userPrincipalName;
  if (!email) return res.status(400).json({ error: 'Could not retrieve email from Microsoft account' });

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') },
  });

  if (!user) return res.status(404).json({ error: 'User not found. Contact your administrator.' });
  if (!user.active) return res.status(403).json({ error: 'User account is inactive' });
  if (user.roles.includes('Superadmin')) return res.status(403).json({ error: 'Superadmin must use the dedicated login' });

  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
};

// Superadmin password login
export const superadminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') },
    roles: 'Superadmin',
  }).select('+password');

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.password) return res.status(401).json({ error: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
};

// Manual email + password login for employees/managers
export const manualLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') },
  }).select('+password');

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.active) return res.status(403).json({ error: 'User account is inactive' });
  if (!user.password) return res.status(401).json({ error: 'No password set. Please use Microsoft login or contact your administrator.' });
  if (user.roles.includes('Superadmin')) return res.status(403).json({ error: 'Superadmin must use the dedicated login' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
};

// Legacy email-based login (kept for backward compat, issues token now)
export const login = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = await User.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.active) return res.status(403).json({ error: 'User account is inactive' });

  const token = generateToken(user);
  res.json({ token, user: sanitizeUser(user) });
};
