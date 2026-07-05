import ImageKit from 'imagekit';

const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

// Enabled when all three ImageKit credentials are present. Otherwise uploads
// stay on local disk (fine for dev; not durable on ephemeral hosting).
export const imagekitEnabled = !!(
  IMAGEKIT_PUBLIC_KEY &&
  IMAGEKIT_PRIVATE_KEY &&
  IMAGEKIT_URL_ENDPOINT
);

export const imagekit = imagekitEnabled
  ? new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    })
  : null;
