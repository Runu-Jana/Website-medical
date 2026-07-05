import fs from 'fs';
import path from 'path';
import { imagekit, imagekitEnabled } from '../lib/imagekit.js';

// @route POST /api/upload  (admin) — single or multiple high-res images / PDFs
// Uploads to ImageKit when configured (persists across deploys); otherwise
// falls back to serving from the local /uploads folder.
export const uploadImages = async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    let urls;
    if (imagekitEnabled) {
      urls = await Promise.all(
        files.map(async (f) => {
          const result = await imagekit.upload({
            file: fs.readFileSync(f.path), // Buffer
            fileName: f.originalname || path.basename(f.path),
            folder: '/dcare',
          });
          fs.unlink(f.path, () => {}); // remove the local temp copy
          return result.url;
        })
      );
    } else {
      const base = `${req.protocol}://${req.get('host')}`;
      urls = files.map((f) => `${base}/uploads/${f.filename}`);
    }
    res.status(201).json({ urls, url: urls[0] });
  } catch (err) {
    res.status(502).json({ message: err.message || 'Image upload failed' });
  }
};
