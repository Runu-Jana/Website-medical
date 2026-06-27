import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @route POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({
    user,
    token: generateToken(user._id),
  });
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({
    user,
    token: generateToken(user._id),
  });
};

// @route POST /api/auth/admin/login  (admin panel login)
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Not an admin account' });
  }
  res.json({
    user,
    token: generateToken(user._id),
  });
};

// @route GET /api/auth/profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.name = req.body.name || user.name;
  user.phone = req.body.phone ?? user.phone;
  if (req.body.address) {
    user.address = { ...(user.address?.toObject?.() ?? user.address ?? {}), ...req.body.address };
  }
  if (req.body.password) user.password = req.body.password;
  const updated = await user.save();
  res.json({ user: updated, token: generateToken(updated._id) });
};
