// Ruta pública: formulario de contacto de organizacion.salonesleprett.com. Guarda en su
// propia colección (org_contact_messages, separada de "consultas" del sitio principal) y
// avisa por email igual que el resto del sitio (ver server/email.js).

const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const notifier = require('../email');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', asyncHandler(async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!name || !name.trim()) return res.status(400).json({ error: 'Falta el nombre.' });
  if (!email || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'El email no es válido.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Falta el mensaje.' });

  const doc = {
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    message: message.trim(),
    created_at: new Date(),
    is_read: false
  };

  await db.getDb().collection('org_contact_messages').insertOne(doc);

  await notifier.notify(
    `Nueva consulta (Organización de Eventos) de ${doc.name}`,
    notifier.renderFields([
      ['Nombre', doc.name],
      ['Email', doc.email],
      ['Teléfono', doc.phone],
      ['Mensaje', doc.message]
    ])
  );

  res.json({ ok: true });
}));

module.exports = router;
