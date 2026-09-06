require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const db = require('./db');
const auth = require('./auth');
const asyncHandler = require('./asyncHandler');
const contentRoutes = require('./routes/content');
const consultasRoutes = require('./routes/consultas');
const productsRoutes = require('./routes/products');
const orgContentRoutes = require('./routes/orgContent');
const orgContactRoutes = require('./routes/orgContact');
const adminRoutes = require('./routes/admin');

// Sub-sitio de Alicia en su propio subdominio, servido por esta misma app (mismo panel
// de administración) en vez de un "Deploy Web App" aparte - no consume otro cupo del
// plan de Hostinger. Se distingue por el hostname de la request, no por la ruta.
const ORG_HOST = 'organizacion.salonesleprett.com';

const app = express();
const PORT = process.env.PORT || 3000;

const crossOriginList = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const isCrossOrigin = crossOriginList.length > 0;

app.set('trust proxy', 1);

if (isCrossOrigin) {
  app.use(cors({ origin: crossOriginList, credentials: true }));
}

app.use(express.json());

app.use(
  session({
    name: 'leprett.sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-cambiar-en-produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      ...(isCrossOrigin ? { sameSite: 'none', secure: true } : {})
    }
  })
);

// El subdominio de Alicia tiene su propia portada - tiene que resolverse ANTES que
// express.static de abajo, porque express.static serviría public/index.html (el sitio
// principal) para cualquier "/" sin importar el hostname si llegara primero.
app.get('/', (req, res, next) => {
  if (req.hostname === ORG_HOST) {
    return res.sendFile(path.join(__dirname, '..', 'public', 'organizacion', 'index.html'));
  }
  next();
});

// Archivos estáticos: el sitio público, las imágenes semilla y lo subido desde el panel.
// Cache-Control explícito: sin esto, la CDN de Hostinger (HCDN) cachea el CSS/JS por
// muchísimo tiempo (más de una hora, visto en la práctica) sin importar el ?v=N de la
// URL ni que el archivo cambie - queda sirviendo una versión vieja a todo el mundo.
const staticOptions = {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
  }
};
app.use(express.static(path.join(__dirname, '..', 'public'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// Página pública de precios/paquetes (a la que apunta el QR descargable desde el panel) -
// URL limpia sin ".html", así queda prolija impresa/escaneada.
app.get('/productos', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'productos.html'));
});

// API pública
app.use('/api/content', contentRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/org-content', orgContentRoutes);
app.use('/api/org-contact', orgContactRoutes);

// Login / logout del panel
app.post('/api/admin/login', asyncHandler(auth.login));
app.post('/api/admin/logout', auth.logout);
app.get('/api/admin/session', (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});
app.post('/api/admin/recover', asyncHandler(auth.recover));

// Cambio de contraseña del panel (requiere sesión activa)
app.put('/api/admin/password', auth.requireAdmin, asyncHandler(auth.changePassword));

// Resto de la API de administración, protegida
app.use('/api/admin', auth.requireAdmin, adminRoutes);

// Handler de errores: cualquier ruta async que falle (por ejemplo, un problema de
// conexión con Mongo) cae acá en vez de colgar la respuesta o tirar el stack crudo.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

async function start() {
  await db.connect();
  app.listen(PORT, () => {
    console.log(`Sitio de Salones Leprett corriendo en http://localhost:${PORT}`);
    console.log(`Panel de administración en http://localhost:${PORT}/admin`);
  });
}

start().catch((err) => {
  console.error('No se pudo arrancar el servidor:', err);
  process.exit(1);
});
