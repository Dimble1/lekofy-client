const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'lekofy-media';

const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

function assertStorageConfig() {
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is missing');
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is missing');
  }
}

function sanitizeSegment(value) {
  return String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getFileExtension(originalName, mimetype) {
  const fromName = path.extname(String(originalName || '')).toLowerCase();
  if (fromName) return fromName;
  return MIME_EXTENSION_MAP[String(mimetype || '').toLowerCase()] || '.bin';
}

function buildObjectPath({ folder, originalName, mimetype }) {
  const safeFolder = sanitizeSegment(folder) || 'uploads';
  const ext = getFileExtension(originalName, mimetype);
  const baseName = sanitizeSegment(path.basename(String(originalName || ''), path.extname(String(originalName || '')))) || 'file';
  const suffix = crypto.randomUUID();
  return `${safeFolder}/${Date.now()}-${suffix}-${baseName}${ext}`;
}

function encodeObjectPath(objectPath) {
  return String(objectPath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function uploadTempFileToSupabase(filePath, options = {}) {
  assertStorageConfig();

  const objectPath = options.objectPath || buildObjectPath({
    folder: options.folder,
    originalName: options.originalName,
    mimetype: options.mimetype,
  });
  const bucket = options.bucket || SUPABASE_BUCKET;
  const contentType = options.contentType || options.mimetype || 'application/octet-stream';
  const body = fs.readFileSync(filePath);
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;

  await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      'x-upsert': 'true',
      'content-type': contentType,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  const publicUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;

  return {
    bucket,
    path: objectPath,
    url: publicUrl,
  };
}

async function createSignedUploadUrl(objectPath, options = {}) {
  assertStorageConfig();

  const bucket = options.bucket || SUPABASE_BUCKET;
  const expiresIn = Number(options.expiresIn || 600);
  const upsert = Boolean(options.upsert);
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;

  const response = await axios.post(
    url,
    { expiresIn, upsert },
    {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        apikey: SUPABASE_SERVICE_KEY,
        'content-type': 'application/json',
      },
      timeout: 30000,
    },
  );

  const data = response.data || {};
  const signedUrl = data.signedURL || data.signedUrl;
  if (!signedUrl) {
    throw new Error('Supabase did not return a signed upload URL');
  }

  const publicUrl = `${SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectPath(objectPath)}`;

  return {
    bucket,
    path: objectPath,
    signedUrl,
    token: data.token || null,
    publicUrl,
  };
}

function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (_err) {
    // ignore cleanup errors
  }
}

module.exports = {
  uploadTempFileToSupabase,
  cleanupTempFile,
  createSignedUploadUrl,
};
