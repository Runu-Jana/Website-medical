import { v2 as cloudinary } from 'cloudinary';

// Enabled when Cloudinary credentials are present (CLOUDINARY_URL, or the
// individual cloud name / key / secret). Otherwise uploads stay on local disk.
const hasParts =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

export const cloudinaryEnabled = !!(process.env.CLOUDINARY_URL || hasParts);

if (cloudinaryEnabled && hasParts) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
// If CLOUDINARY_URL is set, the SDK reads it automatically.

export { cloudinary };
