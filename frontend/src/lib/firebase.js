import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Only enable Firebase phone auth when the project is configured via env.
export const firebaseEnabled = !!(cfg.apiKey && cfg.authDomain && cfg.projectId)

let auth = null
if (firebaseEnabled) {
  const app = initializeApp(cfg)
  auth = getAuth(app)
  auth.useDeviceLanguage()
}

export { auth, RecaptchaVerifier, signInWithPhoneNumber }
