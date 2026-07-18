import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { serializeUser } from '../prisma/serialize.js';
import { JWT_SECRET } from '../lib/jwtSecret.js';

export const protect = async (req, res, next) => {
  let token;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    token = auth.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.user = serializeUser(user); // exposes both id and _id, strips password
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// Vendor-only routes (a seller managing their own catalog).
export const vendor = (req, res, next) => {
  if (req.user && req.user.role === 'vendor') return next();
  return res.status(403).json({ message: 'Vendor access required' });
};

// Pharmacist actions (verifying prescriptions, releasing Rx orders). Admins
// are also allowed, since they can do anything a pharmacist can.
export const pharmacist = (req, res, next) => {
  if (req.user && (req.user.role === 'pharmacist' || req.user.role === 'admin')) return next();
  return res.status(403).json({ message: 'Pharmacist access required' });
};

// Panel routes usable by BOTH admins and vendors; the controller then scopes
// data to the vendor's own records when req.user.role === 'vendor'.
export const panel = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'vendor')) return next();
  return res.status(403).json({ message: 'Panel access required' });
};

// Populates req.user IF a valid token is present, but never blocks the request.
// Used for guest-friendly endpoints (e.g. checkout) so logged-in customers are
// linked to their order and can be emailed, while guests still pass through.
export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) req.user = serializeUser(user);
    } catch {
      /* invalid/expired token — continue as guest */
    }
  }
  next();
};
