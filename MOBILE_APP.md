# Mobile app (PWA + Android/iOS) — build & publish guide

The storefront is now set up two ways at once:

1. **PWA** — installable straight from the browser ("Add to Home Screen"),
   works offline-ish, brand icon + splash. Nothing extra to do; it ships with
   the normal web build.
2. **Capacitor** — wraps the *same* React build into real **Android/iOS apps**
   for the Play Store / App Store. One codebase for web and mobile.

The web deploy is unchanged — all of this is additive.

---

## What was added
- `vite-plugin-pwa` → generates `manifest.webmanifest` + a service worker on
  `npm run build`. App icons live in `frontend/public/` (`pwa-192x192.png`,
  `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon.png`).
- PWA / mobile meta tags in `index.html` (theme colour, apple-touch-icon,
  standalone display, `viewport-fit=cover`).
- Capacitor: `capacitor.config.json`, deps (`@capacitor/core`, `android`,
  `app`, `status-bar`, `keyboard`), and `src/lib/native.js` (status-bar tint +
  Android hardware back button — a **no-op on the web**).
- Safe-area CSS for the notch / home indicator, scoped to `.native-app`.

---

## Build the Android app

**Prerequisites (one-time):** install **Android Studio** (includes the Android
SDK + JDK). No Mac needed for Android.

The **`frontend/android/` native project is already generated and committed**
(with branded adaptive icons + splash), so you can open it directly — no
`cap add` needed.

```bash
cd frontend
npm install

# Set VITE_API_URL in frontend/.env to your LIVE backend URL, then:
npm run cap:sync          # builds the web app + copies it into android/
npm run cap:open:android  # opens Android Studio
```

After **any** web change, re-run `npm run cap:sync` to copy the latest build
into the native app. Regenerate icons/splash after editing `frontend/assets/*`
with: `npx @capacitor/assets generate --android`.

In Android Studio: **Run ▶** to test on a device/emulator, or
**Build → Generate Signed Bundle/APK** to produce the **.aab** you upload to the
Play Store.

**Publish:** create a Google Play Developer account ($25 one-time) →
Play Console → create app → upload the signed `.aab` → fill store listing → submit.

## iOS (optional, needs a Mac)
```bash
npm install @capacitor/ios
npx cap add ios
npm run cap:sync
npx cap open ios          # opens Xcode
```
Requires Xcode + an Apple Developer account ($99/yr). Archive in Xcode and
upload to App Store Connect.

---

## Push notifications (built — just add FCM config)
The plumbing is done end-to-end:
- The app registers the device with FCM on launch and sends the token to the
  backend (`POST /api/me/push-token`, tied to the logged-in customer).
- The backend sends a push when an **order status changes** (reuses the same
  Firebase Admin service account as OTP; a no-op until Firebase is configured).

To turn it on:
1. In **Firebase console → Project settings → Cloud Messaging**, make sure the
   API is enabled.
2. **Project settings → General → Your apps → Add Android app** with package
   name **`com.dbllifecare.app`**, download **`google-services.json`** and drop
   it into **`frontend/android/app/`**.
3. Ensure the backend has the Firebase Admin creds (`FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) — the same ones used for OTP.
4. `npm run cap:sync`, rebuild in Android Studio. Change an order's status in
   admin → the customer gets a notification.

## Other native upgrades (optional, later)
These work in the webview as-is, but native plugins are smoother:
- **Phone OTP**: reCAPTCHA is fiddly in a webview — use
  `@capacitor-firebase/authentication` for native SMS verification.
- **Razorpay**: the web checkout works in the webview; `capacitor-razorpay`
  gives a smoother native sheet.
- **Prescription upload**: `@capacitor/camera` for a native camera/file picker.

## Notes
- `VITE_API_URL` must be an **absolute, HTTPS** URL to your live backend (already
  the case) — the packaged app has no "same origin".
- The router stays `BrowserRouter` (keeps clean web URLs + SEO); Capacitor's
  local server handles SPA fallback, so deep navigation works in the app.
- Commit the generated `android/` (and `ios/`) folders if you want reproducible
  builds; they're the native project. If you'd rather keep the repo lean, add
  them to `.gitignore` and regenerate with `cap add` on each machine.
- Icons were generated from a teal medical-cross mark; replace the PNGs in
  `frontend/public/` with your own artwork any time (keep the same filenames).
