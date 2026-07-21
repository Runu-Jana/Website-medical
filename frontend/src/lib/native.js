// Native-app (Capacitor) integration. Everything here is a NO-OP on the web —
// it only runs when the app is packaged with Capacitor and running on a device,
// so the same codebase serves web and mobile.

export async function initNative() {
  let Capacitor
  try {
    ;({ Capacitor } = await import('@capacitor/core'))
  } catch {
    return // Capacitor not installed / not bundled
  }
  if (!Capacitor?.isNativePlatform?.()) return // running in a normal browser

  // Lets CSS apply device safe-area insets only inside the packaged app.
  document.documentElement.classList.add('native-app')

  // Hold the branded teal splash until the storefront has actually painted, then
  // fade it out — so launch looks intentional with no blank flash. (Config has
  // launchAutoHide:false so the splash waits for this call.)
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    let hidden = false
    const hide = () => {
      if (hidden) return
      hidden = true
      SplashScreen.hide({ fadeOutDuration: 350 }).catch(() => {})
    }
    if (document.readyState === 'complete') requestAnimationFrame(hide)
    else window.addEventListener('load', () => requestAnimationFrame(hide), { once: true })
    setTimeout(hide, 3000) // safety net — never hold the splash longer than 3s
  } catch {
    /* plugin not present */
  }

  // Tint the status bar with the brand colour.
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#0e9f8e' })
  } catch {
    /* plugin not present */
  }

  // Android hardware back button: go back in history, or minimise the app at the root.
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack || window.history.length > 1) window.history.back()
      else App.exitApp()
    })
  } catch {
    /* plugin not present */
  }

  // Push notifications (order updates, offers). Registers the device with FCM and
  // sends the token to the backend (tied to the logged-in customer). No-op until
  // you add the Firebase/FCM config to the native project.
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions()
    if (perm.receive === 'granted') {
      await PushNotifications.register()
      PushNotifications.addListener('registration', async (token) => {
        try {
          const api = (await import('./api')).default
          await api.post('/me/push-token', { token: token.value, platform: 'android' })
        } catch {
          /* not logged in yet — will re-register on next launch */
        }
      })
      // Tapping a notification opens the relevant screen.
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const data = action?.notification?.data || {}
        if (data.type === 'order') window.location.href = '/account'
      })
    }
  } catch {
    /* plugin not present */
  }
}
