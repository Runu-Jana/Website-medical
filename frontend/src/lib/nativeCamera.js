// Native camera helper for the mobile app. Returns a File so callers can upload
// it exactly like a picked file. On the web it returns null (use a file input).

export async function isNativeApp() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

// Prompt the customer to take a photo or pick one from the gallery.
// Resolves to a File, or null if not on the native app / cancelled.
export async function capturePrescription() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const photo = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
      promptLabelHeader: 'Prescription',
      promptLabelPhoto: 'Choose from gallery',
      promptLabelPicture: 'Take a photo',
    })
    const blob = await (await fetch(photo.webPath)).blob()
    const ext = photo.format || 'jpeg'
    return new File([blob], `prescription.${ext}`, { type: blob.type || 'image/jpeg' })
  } catch {
    return null // cancelled or unavailable
  }
}
