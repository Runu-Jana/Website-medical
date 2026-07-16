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
}
