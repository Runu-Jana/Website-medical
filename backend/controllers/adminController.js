import bcrypt from 'bcryptjs';
import prisma from '../prisma/client.js';
import { serializeUser } from '../prisma/serialize.js';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @route GET /api/admins  (admin) — list all admin accounts
export const listAdmins = async (req, res) => {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
  });
  res.json(admins.map(serializeUser));
};

// @route POST /api/admins  (admin) — create a new admin
export const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!emailRe.test(email)) return res.status(400).json({ message: 'Enter a valid email' });
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const lower = email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: lower } });
  if (exists) return res.status(400).json({ message: 'This email is already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { name, email: lower, password: hashed, role: 'admin' },
  });
  res.status(201).json(serializeUser(admin));
};

// @route PUT /api/admins/:id  (admin) — update name / reset password
export const updateAdmin = async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.role !== 'admin') {
    return res.status(404).json({ message: 'Admin not found' });
  }
  const data = {};
  if (req.body.name) data.name = req.body.name;
  if (req.body.password) {
    if (String(req.body.password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    data.password = await bcrypt.hash(req.body.password, 10);
    data.resetCodeHash = null;
    data.resetCodeExpires = null;
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data });
  res.json(serializeUser(updated));
};

// @route DELETE /api/admins/:id  (admin) — remove an admin
export const deleteAdmin = async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.role !== 'admin') {
    return res.status(404).json({ message: 'Admin not found' });
  }
  const count = await prisma.user.count({ where: { role: 'admin' } });
  if (count <= 1) return res.status(400).json({ message: 'Cannot delete the last admin' });

  await prisma.user.delete({ where: { id: target.id } });
  res.json({ success: true });
};
