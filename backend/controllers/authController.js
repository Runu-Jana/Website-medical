import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import generateToken from '../utils/generateToken.js';
import { serializeUser } from '../prisma/serialize.js';

// @route POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const lower = email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: lower } });
  if (exists) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: lower, password: hashed, phone: phone || '' },
  });
  res.status(201).json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Not an admin account' });
  }
  res.json({ user: serializeUser(user), token: generateToken(user.id) });
};

// @route GET /api/auth/profile
export const getProfile = async (req, res) => {
  res.json(serializeUser(req.user));
};

// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.phone !== undefined) data.phone = req.body.phone;
  if (req.body.address) {
    data.address = { ...(user.address || {}), ...req.body.address };
  }
  if (req.body.password) data.password = await bcrypt.hash(req.body.password, 10);

  const updated = await prisma.user.update({ where: { id: user.id }, data });
  res.json({ user: serializeUser(updated), token: generateToken(updated.id) });
};
