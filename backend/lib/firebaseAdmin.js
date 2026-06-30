import admin from 'firebase-admin';

// Enabled only when service-account env vars are present.
export const firebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (firebaseEnabled && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private key in env keeps real newlines escaped as \n.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// Verifies a Firebase ID token (from client phone-auth) and returns its claims.
export const verifyFirebaseToken = async (idToken) => {
  if (!firebaseEnabled) throw new Error('Firebase not configured');
  return admin.auth().verifyIdToken(idToken);
};

export default admin;
