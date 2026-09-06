// Rutas protegidas del panel: editar textos, subir/borrar/reordenar fotos de la
// galería, reemplazar imágenes fijas, gestionar redes sociales y ver las consultas de
// eventos. Se montan detrás de auth.requireAdmin en index.js.

const express = require('express');
const multer = require('multer');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const { uploadBuffer } = require('../cloudinary');
const { ObjectId } = require('mongodb');

const router = express.Router();

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage: multer.memoryStorage(),
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

router.get('/content', asyncHandler(async (req, res) => {
  const contentDoc = await db.getDb().collection('content').findOne({ _id: 'main' });
  const { _id, ...content } = contentDoc || {};
  res.json({ content });
}));

router.put('/content', asyncHandler(async (req, res) => {
  const updates = req.body || {};
  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar.' });

  const clean = {};
  for (const key of keys) clean[key] = String(updates[key] ?? '');

  await db.getDb().collection('content').updateOne({ _id: 'main' }, { $set: clean }, { upsert: true });

  res.json({ ok: true });
}));

// Reemplazar una imagen fija del contenido (banner_image, nosotros_image, etc.), o subir
// una imagen suelta y devolver su URL para usarla donde haga falta.
router.post('/content/image', withMulterErrors('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const cloudResult = await uploadBuffer(req.file.buffer, 'leprett/content');
  const url = cloudResult.secure_url;

  const { key } = req.body || {};
  if (key) {
    await db.getDb().collection('content').updateOne({ _id: 'main' }, { $set: { [key]: url } }, { upsert: true });
  }

  res.json({ ok: true, url });
}));

// ---------- Galería ----------

router.get('/gallery', asyncHandler(async (req, res) => {
  const items = await db.getDb().collection('gallery_images').find().sort({ position: 1, _id: 1 }).toArray();
  res.json({ items: items.map(({ _id, url, alt_text, position }) => ({ id: _id, url, alt: alt_text, position })) });
}));

router.post('/gallery', withMulterErrors('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const cloudResult = await uploadBuffer(req.file.buffer, 'leprett/gallery');
  const url = cloudResult.secure_url;
  const alt = (req.body && req.body.alt) || '';

  const mongo = db.getDb();
  const last = await mongo.collection('gallery_images').find().sort({ position: -1 }).limit(1).toArray();
  const nextPos = last.length > 0 ? last[0].position + 1 : 0;

  const inserted = await mongo.collection('gallery_images').insertOne({ url, alt_text: alt, position: nextPos });

  res.json({ ok: true, id: inserted.insertedId, url });
}));

router.delete('/gallery/:id', asyncHandler(async (req, res) => {
  const result = await db.getDb().collection('gallery_images').deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'No existe esa imagen.' });

  // Nota: la imagen queda huérfana en Cloudinary (no se borra desde acá) - a esta
  // escala no representa un costo real (plan gratis de 25GB).

  res.json({ ok: true });
}));

// Reordenar: recibe la lista completa de ids en el orden final.
router.put('/gallery/reorder', asyncHandler(async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { position: index } } }
  }));
  if (ops.length > 0) await db.getDb().collection('gallery_images').bulkWrite(ops);

  res.json({ ok: true });
}));

// ---------- Redes sociales ----------

router.get('/social', asyncHandler(async (req, res) => {
  const items = await db.getDb().collection('social_links').find().sort({ position: 1, _id: 1 }).toArray();
  res.json({ items: items.map(({ _id, platform, label, url, visible, position }) => ({ id: _id, platform, label, url, visible, position })) });
}));

router.post('/social', asyncHandler(async (req, res) => {
  const { platform, label, url } = req.body || {};
  if (!platform || !label || !url) {
    return res.status(400).json({ error: 'Faltan datos (plataforma, etiqueta o URL).' });
  }

  const mongo = db.getDb();
  const last = await mongo.collection('social_links').find().sort({ position: -1 }).limit(1).toArray();
  const nextPos = last.length > 0 ? last[0].position + 1 : 0;

  const inserted = await mongo.collection('social_links').insertOne({
    platform: platform.trim(),
    label: label.trim(),
    url: url.trim(),
    visible: true,
    position: nextPos
  });

  res.json({ ok: true, id: inserted.insertedId });
}));

// IMPORTANTE: "reorder" tiene que registrarse ANTES que "/:id" - si no, Express matchea
// "reorder" como si fuera el valor de :id (rutas fijas antes que rutas con parámetro).
router.put('/social/reorder', asyncHandler(async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { position: index } } }
  }));
  if (ops.length > 0) await db.getDb().collection('social_links').bulkWrite(ops);

  res.json({ ok: true });
}));

router.put('/social/:id', asyncHandler(async (req, res) => {
  const mongo = db.getDb();
  const row = await mongo.collection('social_links').findOne({ _id: new ObjectId(req.params.id) });
  if (!row) return res.status(404).json({ error: 'No existe esa red.' });

  const { platform, label, url, visible } = req.body || {};
  await mongo.collection('social_links').updateOne(
    { _id: row._id },
    {
      $set: {
        platform: platform ?? row.platform,
        label: label ?? row.label,
        url: url ?? row.url,
        visible: visible === undefined ? row.visible : Boolean(visible)
      }
    }
  );
  res.json({ ok: true });
}));

router.delete('/social/:id', asyncHandler(async (req, res) => {
  const result = await db.getDb().collection('social_links').deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'No existe esa red.' });
  res.json({ ok: true });
}));

// ---------- Consultas de eventos ----------

router.get('/consultas', asyncHandler(async (req, res) => {
  const items = await db.getDb().collection('consultas').find().sort({ created_at: -1 }).toArray();
  res.json({ items: items.map(({ _id, ...rest }) => ({ id: _id, ...rest })) });
}));

router.put('/consultas/:id/read', asyncHandler(async (req, res) => {
  const result = await db.getDb().collection('consultas').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { is_read: true } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: 'No existe esa consulta.' });
  res.json({ ok: true });
}));

router.delete('/consultas/:id', asyncHandler(async (req, res) => {
  const result = await db.getDb().collection('consultas').deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'No existe esa consulta.' });
  res.json({ ok: true });
}));

// ---------- Productos (categorías + items, para la página pública /productos) ----------

router.get('/product-categories', asyncHandler(async (req, res) => {
  const items = await db.getDb().collection('product_categories').find().sort({ position: 1, _id: 1 }).toArray();
  res.json({ items: items.map(({ _id, name, position }) => ({ id: _id, name, position })) });
}));

router.post('/product-categories', asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre de la categoría.' });

  const mongo = db.getDb();
  const last = await mongo.collection('product_categories').find().sort({ position: -1 }).limit(1).toArray();
  const nextPos = last.length > 0 ? last[0].position + 1 : 0;

  const inserted = await mongo.collection('product_categories').insertOne({ name: name.trim(), position: nextPos });
  res.json({ ok: true, id: inserted.insertedId });
}));

// "reorder" antes que "/:id" - si no, Express matchea "reorder" como si fuera el valor
// de :id (rutas fijas antes que rutas con parámetro).
router.put('/product-categories/reorder', asyncHandler(async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { position: index } } }
  }));
  if (ops.length > 0) await db.getDb().collection('product_categories').bulkWrite(ops);

  res.json({ ok: true });
}));

router.put('/product-categories/:id', asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre de la categoría.' });

  const result = await db.getDb().collection('product_categories').updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { name: name.trim() } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: 'No existe esa categoría.' });
  res.json({ ok: true });
}));

// Borra la categoría y de paso todos sus productos - no tiene sentido dejar productos
// huérfanos sin categoría en la página pública.
router.delete('/product-categories/:id', asyncHandler(async (req, res) => {
  const mongo = db.getDb();
  const categoryId = new ObjectId(req.params.id);
  const result = await mongo.collection('product_categories').deleteOne({ _id: categoryId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'No existe esa categoría.' });
  await mongo.collection('products').deleteMany({ category_id: categoryId });
  res.json({ ok: true });
}));

router.get('/products', asyncHandler(async (req, res) => {
  const items = await db.getDb().collection('products').find().sort({ position: 1, _id: 1 }).toArray();
  res.json({
    items: items.map(({ _id, category_id, name, price, image_url, position }) =>
      ({ id: _id, categoryId: category_id, name, price, image: image_url, position }))
  });
}));

router.post('/products', asyncHandler(async (req, res) => {
  const { category_id, name, price } = req.body || {};
  if (!category_id) return res.status(400).json({ error: 'Falta la categoría.' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre del producto.' });

  const mongo = db.getDb();
  const categoryId = new ObjectId(category_id);
  const category = await mongo.collection('product_categories').findOne({ _id: categoryId });
  if (!category) return res.status(400).json({ error: 'Esa categoría no existe.' });

  const last = await mongo.collection('products').find({ category_id: categoryId }).sort({ position: -1 }).limit(1).toArray();
  const nextPos = last.length > 0 ? last[0].position + 1 : 0;

  const inserted = await mongo.collection('products').insertOne({
    category_id: categoryId,
    name: name.trim(),
    price: (price || '').trim(),
    image_url: '',
    position: nextPos
  });
  res.json({ ok: true, id: inserted.insertedId });
}));

// Sube la foto de un producto a Cloudinary y la deja asociada de una - evita un segundo
// viaje al servidor para pegar la URL en el producto.
router.post('/products/image', withMulterErrors('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const { productId } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'Falta el producto.' });

  const cloudResult = await uploadBuffer(req.file.buffer, 'leprett/productos');
  const url = cloudResult.secure_url;

  const result = await db.getDb().collection('products').updateOne(
    { _id: new ObjectId(productId) },
    { $set: { image_url: url } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: 'No existe ese producto.' });

  res.json({ ok: true, url });
}));

router.put('/products/reorder', asyncHandler(async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Falta el array "order".' });

  const ops = order.map((id, index) => ({
    updateOne: { filter: { _id: new ObjectId(id) }, update: { $set: { position: index } } }
  }));
  if (ops.length > 0) await db.getDb().collection('products').bulkWrite(ops);

  res.json({ ok: true });
}));

router.put('/products/:id', asyncHandler(async (req, res) => {
  const mongo = db.getDb();
  const row = await mongo.collection('products').findOne({ _id: new ObjectId(req.params.id) });
  if (!row) return res.status(404).json({ error: 'No existe ese producto.' });

  const { category_id, name, price } = req.body || {};
  const update = {
    name: name !== undefined ? String(name).trim() : row.name,
    price: price !== undefined ? String(price).trim() : row.price
  };
  if (category_id) update.category_id = new ObjectId(category_id);

  await mongo.collection('products').updateOne({ _id: row._id }, { $set: update });
  res.json({ ok: true });
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
  const result = await db.getDb().collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'No existe ese producto.' });
  res.json({ ok: true });
}));

// El QR en sí vive en la ruta pública (server/routes/products.js), no acá - tiene que
// poder verlo cualquier visitante sin sesión, ya que se muestra también en la página
// principal del sitio.

module.exports = router;
