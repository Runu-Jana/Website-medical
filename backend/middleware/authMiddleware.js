import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';
import { serializeUser } from '../prisma/serialize.js';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
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

// Populates req.user IF a valid token is present, but never blocks the request.
// Used for guest-friendly endpoints (e.g. checkout) so logged-in customers are
// linked to their order and can be emailed, while guests still pass through.
export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'devsecret');
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (user) req.user = serializeUser(user);
    } catch {
      /* invalid/expired token — continue as guest */
    }
  }
  next();
};
