// Ruta pública: recibe la consulta de evento del formulario del sitio (reemplaza al
// "contacto" genérico de los otros sitios - acá el dato valioso es tipo de evento,
// fecha y cantidad de invitados, no un mensaje libre). Guarda en Mongo y avisa por
// email a Alicia (ver server/email.js - si no está configurado, no manda el aviso,
// pero la consulta queda guardada igual, visible en el panel).

const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const notifier = require('../email');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', asyncHandler(async (req, res) => {
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

  const doc = {
    agasajado: agasajado.trim(),
    solicitante: solicitante.trim(),
    localidad: (localidad || '').trim(),
    telefono: telefono.trim(),
    celular: (celular || '').trim(),
    email: email.trim(),
    tipo_evento: (tipo_evento || '').trim(),
    fecha_evento: fecha_evento.trim(),
    cantidad_invitados: cantidad_invitados.trim(),
    comentarios: (comentarios || '').trim(),
    created_at: new Date(),
    is_read: false
  };

  await db.getDb().collection('consultas').insertOne(doc);

  await notifier.notify(
    `Nueva consulta de evento - ${doc.agasajado}`,
    notifier.renderFields([
      ['Agasajado/Empresa', doc.agasajado],
      ['Solicitante', doc.solicitante],
      ['Localidad', doc.localidad],
      ['Teléfono', doc.telefono],
      ['Celular', doc.celular],
      ['Email', doc.email],
      ['Tipo de evento', doc.tipo_evento],
      ['Fecha del evento', doc.fecha_evento],
      ['Cantidad de invitados', doc.cantidad_invitados],
      ['Comentarios', doc.comentarios]
    ])
  );

  res.json({ ok: true });
}));

module.exports = router;
