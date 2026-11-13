import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db/index.js';
import { requireAuth } from '../auth/middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '../..');

// Honour DATA_DIR (Railway volume) for uploads, fall back to ./server/uploads locally.
export const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(path.resolve(process.env.DATA_DIR), 'uploads')
  : path.join(serverRoot, 'uploads');

await fs.mkdir(UPLOADS_DIR, { recursive: true });

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB raw
const ACCEPTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_MIME.has(file.mimetype)) return cb(null, true);
    const isHeic = /heic|heif/i.test(file.mimetype) || /\.(heic|heif)$/i.test(file.originalname);
    cb(new Error(isHeic ? 'unsupported_heic' : 'unsupported_mime'));
  },
});

const router = Router();

// Where is each upload URL referenced in the site content? Returns a list of
// human-readable places (section type / settings key) per URL.
async function findUsages() {
  const [sections, settings] = await Promise.all([
    db('sections').select('type', 'data_json'),
    db('settings').select('key', 'value_json'),
  ]);
  const sources = [
    ...sections.map((s) => ({ place: `section:${s.type}`, text: s.data_json })),
    ...settings.map((s) => ({ place: `settings:${s.key}`, text: s.value_json })),
  ];
  return (url) => [...new Set(sources.filter((s) => s.text.includes(url)).map((s) => s.place))];
}

router.get('/', requireAuth, async (_req, res) => {
  const rows = await db('uploads').select('*').orderBy('uploaded_at', 'desc');
  const usagesOf = await findUsages();
  res.json({ items: rows.map((r) => ({ ...r, used_in: usagesOf(r.url) })) });
});

router.post('/', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 'file_too_large' : err.message || 'upload_failed';
      return res.status(400).json({ error: code });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });

  const { mimetype, buffer, originalname, size } = req.file;
  const id = randomBytes(8).toString('hex');
  const safeBase = originalname.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);

  let filename;
  let finalMime;
  let finalBuffer;
  let finalSize;

  if (mimetype === 'image/svg+xml') {
    // Pass SVG through unchanged (it's vector and small).
    filename = `${id}-${safeBase}.svg`;
    finalMime = 'image/svg+xml';
    finalBuffer = buffer;
    finalSize = size;
  } else {
    // Raster: resize to max 2000px, convert to WebP q80.
    let processed;
    try {
      processed = await sharp(buffer)
        .rotate() // honor EXIF orientation
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (err) {
      console.warn('[uploads] unreadable image', originalname, err.message);
      return res.status(400).json({ error: 'invalid_image' });
    }
    filename = `${id}-${safeBase}.webp`;
    finalMime = 'image/webp';
    finalBuffer = processed;
    finalSize = processed.byteLength;
  }

  const fullPath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(fullPath, finalBuffer);

  const url = `/uploads/${filename}`;
  const alt = (req.body.alt || '').toString().slice(0, 200);

  const [insertedId] = await db('uploads').insert({
    filename,
    url,
    mime: finalMime,
    size: finalSize,
    alt,
    uploaded_by: req.user.id,
  });

  const row = await db('uploads').where({ id: insertedId }).first();
  res.status(201).json({ upload: row });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
  const alt = (req.body.alt ?? '').toString().slice(0, 200);
  const existing = await db('uploads').where({ id }).first();
  if (!existing) return res.status(404).json({ error: 'not_found' });
  await db('uploads').where({ id }).update({ alt });
  const updated = await db('uploads').where({ id }).first();
  res.json({ upload: updated });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });
  const row = await db('uploads').where({ id }).first();
  if (!row) return res.status(404).json({ error: 'not_found' });

  // Refuse to delete an image still displayed on the site (unless forced).
  const usedIn = (await findUsages())(row.url);
  if (usedIn.length > 0 && req.query.force !== '1') {
    return res.status(409).json({ error: 'upload_in_use', used_in: usedIn });
  }

  const filePath = path.join(UPLOADS_DIR, row.filename);
  await fs.unlink(filePath).catch(() => {}); // ignore if already missing
  await db('uploads').where({ id }).del();
  res.json({ ok: true });
});

export default router;
