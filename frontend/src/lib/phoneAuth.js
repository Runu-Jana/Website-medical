import { auth, firebaseEnabled, RecaptchaVerifier, signInWithPhoneNumber } from './firebase'

// Phone OTP that works on both web (Firebase JS SDK + invisible reCAPTCHA) and
// inside the mobile app (native Firebase Auth plugin — no reCAPTCHA needed).

const isNative = () => {
  try {
    return !!window.Capacitor?.isNativePlatform?.()
  } catch {
    return false
  }
}

let webConfirmation = null
let recaptcha = null
let nativeVerificationId = null

// True when real (non-dev) OTP can be sent on this platform.
export const realOtpAvailable = () => isNative() || firebaseEnabled

// Send the OTP SMS. Resolves once the code has been dispatched.
export async function startPhoneAuth(e164, recaptchaContainerId = 'recaptcha-container') {
  if (isNative()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    nativeVerificationId = null
    const handle = await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      nativeVerificationId = event.verificationId
    })
    try {
      await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: e164 })
      // Android delivers the verificationId asynchronously — wait briefly for it.
      for (let i = 0; i < 40 && !nativeVerificationId; i++) {
        await new Promise((r) => setTimeout(r, 150))
      }
    } finally {
      await handle.remove()
    }
    if (!nativeVerificationId) throw new Error('Could not send the code. Please try again.')
    return
  }

  if (firebaseEnabled) {
    if (!recaptcha) recaptcha = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' })
    webConfirmation = await signInWithPhoneNumber(auth, e164, recaptcha)
    return
  }
  // Dev mode — nothing to send; the backend accepts the dev code.
}

// Confirm the entered code; returns a Firebase ID token for the backend to verify.
// Returns null in dev mode (caller falls back to phone + code).
export async function confirmPhoneCode(code) {
  if (isNative()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    await FirebaseAuthentication.confirmVerificationCode({
      verificationId: nativeVerificationId,
      verificationCode: code,
    })
    const { token } = await FirebaseAuthentication.getIdToken()
    return token
  }
  if (firebaseEnabled && webConfirmation) {
    const result = await webConfirmation.confirm(code)
    return await result.user.getIdToken()
  }
  return null
}
