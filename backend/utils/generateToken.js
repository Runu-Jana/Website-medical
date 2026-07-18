import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/jwtSecret.js';

const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

export default generateToken;
