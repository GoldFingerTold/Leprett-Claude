// Ruta pública: recibe la consulta de evento del formulario del sitio (reemplaza al
// "contacto" genérico de los otros sitios - acá el dato valioso es tipo de evento,
// fecha y cantidad de invitados, no un mensaje libre).

const express = require('express');
const db = require('../db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', (req, res) => {
  const {
    agasajado, solicitante, localidad, telefono, celular, email,
    tipo_evento, fecha_evento, cantidad_invitados, comentarios
  } = req.body || {};

  if (!agasajado || !agasajado.trim()) return res.status(400).json({ error: 'Falta el nombre del agasajado/empresa.' });
  if (!solicitante || !solicitante.trim()) return res.status(400).json({ error: 'Falta el nombre del solicitante.' });
  if (!telefono || !telefono.trim()) return res.status(400).json({ error: 'Falta el teléfono.' });
  if (!email || !EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'El email no es válido.' });
  if (!fecha_evento || !fecha_evento.trim()) return res.status(400).json({ error: 'Falta la fecha del evento.' });
  if (!cantidad_invitados || !cantidad_invitados.trim()) return res.status(400).json({ error: 'Falta la cantidad de invitados.' });

  db.prepare(
    `INSERT INTO consultas
      (agasajado, solicitante, localidad, telefono, celular, email, tipo_evento, fecha_evento, cantidad_invitados, comentarios)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    agasajado.trim(),
    solicitante.trim(),
    (localidad || '').trim(),
    telefono.trim(),
    (celular || '').trim(),
    email.trim(),
    (tipo_evento || '').trim(),
    fecha_evento.trim(),
    cantidad_invitados.trim(),
    (comentarios || '').trim()
  );

  res.json({ ok: true });
});

module.exports = router;
