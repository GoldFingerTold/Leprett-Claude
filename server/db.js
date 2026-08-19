// Conexión a SQLite + esquema + contenido semilla.
// Mismo patrón que sitio-lecoin-recepciones/server/db.js (node:sqlite, sin dependencias
// nativas). Se ejecuta una sola vez al arrancar: si la base ya existe, no vuelve a
// sembrar nada.

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'site.db'));
db.exec('PRAGMA journal_mode = WAL');

function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    alt_text TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    visible INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
  );

  -- Reemplaza al "contact_messages" genérico de los otros sitios: acá el formulario del
  -- sitio original ya pedía datos puntuales de la consulta (tipo de evento, fecha,
  -- invitados), mucho más útiles para un salón de fiestas que un mensaje libre.
  CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agasajado TEXT NOT NULL,
    solicitante TEXT NOT NULL,
    localidad TEXT NOT NULL DEFAULT '',
    telefono TEXT NOT NULL,
    celular TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    tipo_evento TEXT NOT NULL DEFAULT '',
    fecha_evento TEXT NOT NULL DEFAULT '',
    cantidad_invitados TEXT NOT NULL DEFAULT '',
    comentarios TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_read INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS admin_user (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
  );
`);

// --- Contenido semilla (texto real del sitio actual de Salones Leprett) ---
const DEFAULT_CONTENT = {
  site_name: 'Salones Leprett',
  site_tagline: 'Multiespacio para eventos sociales y corporativos',

  nav_home_label: 'Inicio',
  nav_nosotros_label: 'Nosotros',
  nav_instalaciones_label: 'Instalaciones',
  nav_servicios_label: 'Servicios',
  nav_ubicacion_label: 'Ubicación',
  nav_contacto_label: 'Contacto',

  banner_image: '/img/seed/banner-1.jpg',
  banner_title: 'Salones Leprett',
  banner_subtitle: 'Un concepto moderno y diferente que combina estilo, distinción y confort, con profesionalismo y tecnología de vanguardia.',

  nosotros_heading: 'Nosotros',
  nosotros_subheading: 'Quiénes somos',
  nosotros_image: '/img/seed/nosotros.jpg',
  nosotros_text: [
    'Somos un Multiespacio para eventos sociales y corporativos, un concepto moderno y diferente que combina estilo, distinción y confort, con profesionalismo y tecnología de vanguardia.',
    'Cinco espacios equipados con la mayor comodidad, adaptados a su necesidad, con una capacidad de 80 a 900 personas.',
    'Nuestro grupo de trabajo posee el "Know How Internacional" para asesorarlo y proveerle todos los servicios complementarios que su evento requiera.'
  ].join('\n\n'),

  instalaciones_heading: 'Instalaciones',
  instalaciones_subheading: 'Cinco espacios, un mismo nivel de calidad',
  instalaciones_salones: [
    'Salón de los Arcos',
    'Salón Jardín de los Arcos',
    'Salón de los Espejos',
    'Salón Cristal',
    'Salón de las Luces'
  ].join('\n\n'),

  servicios_heading: 'Servicios',
  servicios_subheading: 'Todo lo que tu evento necesita',
  servicios_text: [
    'Opciones de catering de primera calidad.',
    'Organización integral de eventos sociales y corporativos.',
    'Disc Jockey.',
    'Baño y rampa para personas con movilidad reducida.',
    'Parque fotográfico.',
    'Estacionamiento con capacidad para 150 vehículos.',
    'Ambiente climatizado (frío y calor).',
    'Grupo electrógeno propio para emergencias.',
    'Suite vestidor.',
    'Oficina de apoyo.',
    'Internet: banda ancha por WI-FI.',
    'Espectáculo de luz y sonido digital.',
    'Iluminación inteligente - láser 3D.',
    'Pantalla gigante + proyector.'
  ].join('\n\n'),

  ubicacion_heading: 'Ubicación',
  ubicacion_subheading: 'Fácil acceso, en pleno centro',
  ubicacion_text: 'Se encuentra en el barrio de Monserrat, de fácil acceso, en pleno centro de la Ciudad.',
  ubicacion_address: 'Sáenz Peña 739, CABA',
  ubicacion_map_image: '/img/seed/mapa.jpg',

  contact_heading: 'Contacto',
  contact_subheading: 'Contanos sobre tu evento y te respondemos a la brevedad.',
  contact_person: 'Alicia Vivanco',
  contact_phone: '11-6895-1017',
  contact_phone_2: '11-5517-3337',
  contact_email: 'info@salonesleprett.com.ar',
  contact_email_2: 'alicia@salonesleprett.com.ar',

  footer_text: 'Salones Leprett'
};

function seedIfEmpty() {
  const contentCount = db.prepare('SELECT COUNT(*) AS n FROM content').get().n;
  if (contentCount === 0) {
    const insert = db.prepare('INSERT INTO content (key, value) VALUES (?, ?)');
    const insertMany = transaction((entries) => {
      for (const [key, value] of entries) insert.run(key, String(value));
    });
    insertMany(Object.entries(DEFAULT_CONTENT));
  }

  const galleryCount = db.prepare('SELECT COUNT(*) AS n FROM gallery_images').get().n;
  if (galleryCount === 0) {
    const insert = db.prepare('INSERT INTO gallery_images (url, alt_text, position) VALUES (?, ?, ?)');
    const insertMany = transaction((items) => {
      items.forEach((item, i) => insert.run(item.url, item.alt, i));
    });

    const items = [
      { url: '/img/seed/salon-arcos.jpg', alt: 'Salón de los Arcos' },
      { url: '/img/seed/salon-jardin.jpg', alt: 'Salón Jardín de los Arcos' },
      { url: '/img/seed/salon-espejos.jpg', alt: 'Salón de los Espejos' },
      { url: '/img/seed/salon-cristal.jpg', alt: 'Salón Cristal' },
      { url: '/img/seed/salon-luces.jpg', alt: 'Salón de las Luces' }
    ];
    const galleryNums = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105];
    galleryNums.forEach((n) => {
      items.push({ url: `/img/seed/galeria-${n}.jpg`, alt: `Salones Leprett ${n}` });
    });

    insertMany(items);
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM admin_user').get().n;
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD || 'cambiar-esta-clave';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admin_user (username, password_hash) VALUES (?, ?)').run('admin', hash);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '[aviso] No hay ADMIN_PASSWORD en .env: se creó el usuario admin con la clave por defecto ' +
        '"cambiar-esta-clave". Copiá .env.example a .env y definí una clave propia antes de publicar el sitio.'
      );
    }
  }
}

seedIfEmpty();

db.transaction = transaction;

module.exports = db;
