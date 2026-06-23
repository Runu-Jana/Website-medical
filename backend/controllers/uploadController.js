// @route POST /api/upload  (admin) — single or multiple high-res images
export const uploadImages = (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = files.map((f) => `${base}/uploads/${f.filename}`);
  res.status(201).json({ urls, url: urls[0] });
};
