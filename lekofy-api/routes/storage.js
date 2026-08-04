const router = require('express').Router();
const auth = require('../middleware/auth');
const { createSignedUploadUrl } = require('../services/supabaseStorage');

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getExtension(originalName, mimetype) {
  const name = String(originalName || '');
  const dot = name.lastIndexOf('.');
  if (dot >= 0 && dot < name.length - 1) {
    return name.slice(dot).toLowerCase();
  }
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  };
  return map[String(mimetype || '').toLowerCase()] || '.bin';
}

function createPath(folder, originalName, mimetype) {
  const safeFolder = sanitizeSegment(folder) || 'uploads';
  const base = sanitizeSegment(String(originalName || '').replace(/\.[^.]+$/, '')) || 'file';
  return `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${base}${getExtension(originalName, mimetype)}`;
}

router.post('/signed-upload', auth, async (req, res) => {
  try {
    const folder = req.body?.folder || 'uploads';
    const originalName = req.body?.originalName || 'file';
    const mimetype = req.body?.mimetype || 'application/octet-stream';
    const bucket = req.body?.bucket || undefined;
    const upsert = Boolean(req.body?.upsert);

    const path = createPath(folder, originalName, mimetype);
    const signed = await createSignedUploadUrl(path, { bucket, upsert, expiresIn: 600 });

    res.json({
      bucket: signed.bucket,
      path: signed.path,
      signedUrl: signed.signedUrl,
      token: signed.token,
      publicUrl: signed.publicUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
