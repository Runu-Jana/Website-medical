import crypto from 'crypto';
import prisma from '../prisma/client.js';
import { sendMail } from './mailer.js';

// Roles that are allowed to use the shared panel reset flow (admins + sellers).
export const PANEL_ROLES = ['admin', 'vendor'];

export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');

// Generates a 6-digit reset code, stores its hash + a 15-minute expiry on the
// user, and emails the code to them. Returns nothing on purpose — the caller
// should never expose the code (it only reaches the user via their inbox).
export const issueResetCode = async (user) => {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCodeHash: hashToken(code),
      resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  // Send in the background so a slow/unreachable mail server never blocks the
  // HTTP response. The code is already stored above; sendMail swallows its own
  // errors, so the request returns immediately either way.
  sendMail({
    to: user.email,
    subject: 'Your DBL Life Care password reset code',
    text: `Your password reset code is ${code}. It expires in 15 minutes. If you didn't request this, ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
             <h2 style="color:#0e9f8e">Password reset</h2>
             <p>Use this code to reset your DBL Life Care account password:</p>
             <p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p>
             <p style="color:#64748b;font-size:13px">Expires in 15 minutes. If you didn't request this, ignore this email.</p>
           </div>`,
  }).catch(() => {});
};
