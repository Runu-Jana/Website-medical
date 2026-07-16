import admin, { firebaseEnabled } from './firebaseAdmin.js';
import prisma from './../prisma/client.js';

// Push notifications reuse the Firebase Admin SDK (same service account as OTP).
// A no-op unless Firebase is configured, so nothing breaks without it.
export const pushEnabled = firebaseEnabled;

// Send a notification to every device a user has registered. Silently prunes
// tokens Firebase reports as dead, and never throws into the caller.
export const sendPushToUser = async (userId, { title, body, data = {} }) => {
  if (!firebaseEnabled || !userId) return;
  const rows = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } }).catch(() => []);
  const tokens = rows.map((r) => r.token);
  if (!tokens.length) return;

  try {
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    const dead = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
        dead.push(tokens[i]);
      }
    });
    if (dead.length) await prisma.deviceToken.deleteMany({ where: { token: { in: dead } } }).catch(() => {});
  } catch {
    /* ignore push failures */
  }
};
