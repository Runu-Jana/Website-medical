import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Photos (incl. iPhone HEIC) and scanned PDFs. SVG is intentionally excluded
  // because it can carry embedded scripts (an XSS / malware vector).
  const allowedExt = /jpeg|jpg|png|webp|avif|heic|heif|pdf/;
  const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
  // Some phones report HEIC as application/octet-stream, so allow that too.
  const mimeOk = /^image\/|^application\/pdf$|^application\/octet-stream$/.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only images (JPG, PNG, WEBP, HEIC) or PDF files are allowed'));
};

// Generous per-file limit (default 25MB) — plenty for high-res photos & PDFs,
// while blocking abusive multi-GB uploads. Override via MAX_UPLOAD_BYTES.
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 25 * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

export default upload;
