// Ruta pública: todo lo que necesita organizacion.salonesleprett.com en una sola
// llamada. Contenido totalmente separado del sitio principal (colecciones org_content /
// org_gallery_images) aunque vive en la misma base y el mismo servidor.

const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const mongo = db.getDb();

  const contentDoc = await mongo.collection('org_content').findOne({ _id: 'main' });
  const { _id, ...content } = contentDoc || {};

  const gallery = await mongo
    .collection('org_gallery_images')
    .find({}, { projection: { url: 1, alt_text: 1 } })
    .sort({ position: 1, _id: 1 })
    .toArray();

  res.json({
    content,
    gallery: gallery.map(({ _id, url, alt_text }) => ({ id: _id, url, alt: alt_text }))
  });
}));

module.exports = router;
