// Ruta pública: todo lo que necesita la página principal en una sola llamada.

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM content').all();
  const content = {};
  for (const row of rows) content[row.key] = row.value;

  const gallery = db
    .prepare('SELECT id, url, alt_text AS alt FROM gallery_images ORDER BY position ASC, id ASC')
    .all();

  const social = db
    .prepare(
      'SELECT id, platform, label, url FROM social_links WHERE visible = 1 ORDER BY position ASC, id ASC'
    )
    .all();

  res.json({ content, gallery, social });
});

module.exports = router;
