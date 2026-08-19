// Rutas protegidas del panel: editar textos, subir/borrar/reordenar fotos de la
// galería, reemplazar imágenes fijas, gestionar redes sociales y ver las consultas de
// eventos. Se montan detrás de auth.requireAdmin en index.js.

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error('Formato de imagen no soportado. Usá JPG, PNG, WEBP o GIF.'));
    }
    cb(null, true);
  }
});

function withMulterErrors(field) {
  const mw = upload.single(field);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  };
}

// ---------- Textos ----------

router.get('/content', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM content').all();
  const content = {};
  for (const row of rows) content[row.key] = row.value;
  res.json({ content });
});

router.put('/content', (req, res) => {
  const updates = req.body || {};
  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar.' });

  const upsert = db.prepare(
    'INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const applyAll = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run(key, String(value ?? ''));
  });
  applyAll(Object.entries(updates));

  res.json({ ok: true });
});

// Reemplazar una imagen fija del contenido (banner_image o escuela_image), o subir
// una imagen suelta y devolver su URL para usarla donde haga falta.
router.post('/content/image', withMulterErrors('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const url = `/uploads/${req.file.filename}`;

  const { key } = req.body || {};
  if (key) {
    db.prepare(
      'INSERT INTO content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    ).run(key, url);
  }

  res.json({ ok: true, url });
});

// ---------- Galería ----------

router.get('/gallery', (req, res) => {
  const items = db
    .prepare('SELECT id, url, alt_text AS alt, position FROM gallery_images ORDER BY position ASC, id ASC')
    .all();
  res.json({ items });
});

router.post('/gallery', withMulterErrors('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const url = `/uploads/${req.file.filename}`;
  const alt = (req.body && req.body.alt) || '';

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM gallery_images').get().m;
  const info = db
    .prepare('INSERT INTO gallery_images (url, alt_text, position) VALUES (?, ?, ?)')
    .run(url, alt, maxPos + 1);

  res.json({ ok: true, id: info.lastInsertRowid, url });
});

router.delete('/gallery/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM gallery_images WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'No existe esa imagen.' });

  db.prepare('DELETE FROM gallery_images WHERE id = ?').run(id);

  // Si el archivo vive en /uploads (subido desde el panel), lo borramos también.
  // Las imágenes semilla en /img/seed se dejan intactas.
  if (row.url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOAD_DIR, path.basename(row.url));
    fs.unlink(filePath, () => {});
  }

  res.json({ ok: true });
});

// Reordenar: recibe la lista completa de ids en el orden final.
router.put('/gallery/reorder', (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const update = db.prepare('UPDATE gallery_images SET position = ? WHERE id = ?');
  const applyAll = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, Number(id)));
  });
  applyAll(order);

  res.json({ ok: true });
});

// ---------- Redes sociales ----------

router.get('/social', (req, res) => {
  const items = db
    .prepare('SELECT id, platform, label, url, visible, position FROM social_links ORDER BY position ASC, id ASC')
    .all();
  res.json({ items });
});

router.post('/social', (req, res) => {
  const { platform, label, url } = req.body || {};
  if (!platform || !label || !url) {
    return res.status(400).json({ error: 'Faltan datos (plataforma, etiqueta o URL).' });
  }
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM social_links').get().m;
  const info = db
    .prepare('INSERT INTO social_links (platform, label, url, visible, position) VALUES (?, ?, ?, 1, ?)')
    .run(platform.trim(), label.trim(), url.trim(), maxPos + 1);
  res.json({ ok: true, id: info.lastInsertRowid });
});

// IMPORTANTE: "reorder" tiene que registrarse ANTES que "/:id" - si no, Express matchea
// "reorder" como si fuera el valor de :id (rutas fijas antes que rutas con parámetro).
router.put('/social/reorder', (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const update = db.prepare('UPDATE social_links SET position = ? WHERE id = ?');
  const applyAll = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, Number(id)));
  });
  applyAll(order);

  res.json({ ok: true });
});

router.put('/social/:id', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM social_links WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'No existe esa red.' });

  const { platform, label, url, visible } = req.body || {};
  db.prepare(
    'UPDATE social_links SET platform = ?, label = ?, url = ?, visible = ? WHERE id = ?'
  ).run(
    platform ?? row.platform,
    label ?? row.label,
    url ?? row.url,
    visible === undefined ? row.visible : (visible ? 1 : 0),
    id
  );
  res.json({ ok: true });
});

router.delete('/social/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM social_links WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'No existe esa red.' });
  res.json({ ok: true });
});

// ---------- Consultas de eventos ----------

router.get('/consultas', (req, res) => {
  const items = db.prepare('SELECT * FROM consultas ORDER BY created_at DESC').all();
  res.json({ items });
});

router.put('/consultas/:id/read', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('UPDATE consultas SET is_read = 1 WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'No existe esa consulta.' });
  res.json({ ok: true });
});

router.delete('/consultas/:id', (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM consultas WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'No existe esa consulta.' });
  res.json({ ok: true });
});

module.exports = router;
