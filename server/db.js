// Conexión a MongoDB Atlas + contenido semilla. Migrado desde node:sqlite (mismo motivo
// que los demás sitios): el disco de la app en Hostinger no sobrevive a un redeploy, así
// que una base de archivo único como SQLite puede perderse entera en el próximo deploy.

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    'Falta la variable de entorno MONGODB_URI (el connection string de MongoDB Atlas). ' +
    'Copiá .env.example a .env y completala antes de arrancar el servidor.'
  );
}

const client = new MongoClient(uri);
let db = null;

function getDb() {
  if (!db) throw new Error('La base de datos todavía no está conectada. Llamá a connect() primero.');
  return db;
}

async function connect() {
  await client.connect();
  db = client.db();
  await ensureIndexes();
  await seedIfEmpty();
  console.log('Conectado a MongoDB Atlas.');
}

async function ensureIndexes() {
  await db.collection('gallery_images').createIndex({ position: 1 });
  await db.collection('social_links').createIndex({ position: 1 });
  await db.collection('consultas').createIndex({ created_at: -1 });
  await db.collection('product_categories').createIndex({ position: 1 });
  await db.collection('products').createIndex({ category_id: 1, position: 1 });
  await db.collection('org_gallery_images').createIndex({ position: 1 });
  await db.collection('org_contact_messages').createIndex({ created_at: -1 });
}

// --- Contenido semilla (texto real del sitio actual de Salones Leprett) ---
const DEFAULT_CONTENT = {
  site_name: 'Salones Leprett',
  site_tagline: 'Multiespacio para eventos sociales y corporativos',

  nav_home_label: 'Inicio',
  nav_nosotros_label: 'Nosotros',
  nav_instalaciones_label: 'Instalaciones',
  nav_servicios_label: 'Servicios',
  nav_ubicacion_label: 'Ubicación',
  nav_telefono_label: 'Teléfono',
  nav_productos_label: 'Precios',
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

  productos_heading: 'Precios y paquetes',
  productos_subheading: 'Escaneá para ver',

  contact_heading: 'Contacto',
  contact_subheading: 'Contanos sobre tu evento y te respondemos a la brevedad.',
  contact_person: 'Alicia Vivanco',
  contact_phone: '11-6895-1017',
  contact_phone_2: '11-5517-3337',
  // Dominio .com (no .com.ar): el sitio se mudó a salonesleprett.com - estas direcciones
  // se ven en el footer del sitio, tienen que coincidir con el dominio real.
  contact_email: 'info@salonesleprett.com',
  contact_email_2: 'alicia@salonesleprett.com',

  footer_text: 'Salones Leprett'
};

// --- Contenido semilla de organizacion.salonesleprett.com (sub-sitio de Alicia, mismo
// panel de administración, contenido totalmente separado del principal) - texto de
// relleno a propósito: Hugo va a cargar el contenido real desde el panel, pestaña
// "Organización", apenas esté listo el DNS del subdominio. ---
const DEFAULT_ORG_CONTENT = {
  site_name: 'Leprett — Organización de Eventos',
  site_tagline: 'Organización integral de tu evento, de punta a punta',

  nav_home_label: 'Inicio',
  nav_nosotros_label: 'Nosotros',
  nav_servicios_label: 'Servicios',
  nav_imagenes_label: 'Imágenes',
  nav_telefono_label: 'Teléfono',
  nav_contacto_label: 'Contacto',

  banner_image: '',
  banner_title: 'Organización de Eventos',
  banner_subtitle: 'Coordinamos cada detalle de tu evento social o corporativo, de principio a fin.',

  nosotros_heading: 'Nosotros',
  nosotros_subheading: 'Quiénes somos',
  nosotros_image: '',
  nosotros_text: 'Contenido de ejemplo: acá va la presentación del servicio de organización de eventos. Se edita desde el panel, pestaña "Organización".',

  servicios_heading: 'Servicios',
  servicios_subheading: 'Qué incluye',
  servicios_text: [
    'Coordinación integral del evento.',
    'Selección y contratación de proveedores.',
    'Planificación de cronograma y logística.',
    'Acompañamiento el día del evento.'
  ].join('\n\n'),

  imagenes_heading: 'Imágenes',
  imagenes_subheading: 'Algunos de nuestros trabajos',

  contact_heading: 'Contacto',
  contact_subheading: 'Contanos sobre tu evento y te respondemos a la brevedad.',
  contact_phone: '11-5517-3337',
  contact_email: 'alicia@salonesleprett.com',

  footer_text: 'Leprett — Organización de Eventos'
};

const DEFAULT_GALLERY = (() => {
  const items = [
    { url: '/img/seed/salon-arcos.jpg', alt_text: 'Salón de los Arcos' },
    { url: '/img/seed/salon-jardin.jpg', alt_text: 'Salón Jardín de los Arcos' },
    { url: '/img/seed/salon-espejos.jpg', alt_text: 'Salón de los Espejos' },
    { url: '/img/seed/salon-cristal.jpg', alt_text: 'Salón Cristal' },
    { url: '/img/seed/salon-luces.jpg', alt_text: 'Salón de las Luces' }
  ];
  const galleryNums = [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81, 85, 89, 93, 97, 101, 105];
  galleryNums.forEach((n) => {
    items.push({ url: `/img/seed/galeria-${n}.jpg`, alt_text: `Salones Leprett ${n}` });
  });
  return items;
})();

async function seedIfEmpty() {
  const contentDoc = await db.collection('content').findOne({ _id: 'main' });
  if (!contentDoc) {
    await db.collection('content').insertOne({ _id: 'main', ...DEFAULT_CONTENT });
  } else {
    const missing = {};
    for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
      if (!(key in contentDoc)) missing[key] = value;
    }
    if (Object.keys(missing).length > 0) {
      await db.collection('content').updateOne({ _id: 'main' }, { $set: missing });
    }
  }

  const galleryCount = await db.collection('gallery_images').countDocuments();
  if (galleryCount === 0) {
    await db.collection('gallery_images').insertMany(
      DEFAULT_GALLERY.map((item, i) => ({ ...item, position: i }))
    );
  }

  const orgContentDoc = await db.collection('org_content').findOne({ _id: 'main' });
  if (!orgContentDoc) {
    await db.collection('org_content').insertOne({ _id: 'main', ...DEFAULT_ORG_CONTENT });
  } else {
    const missing = {};
    for (const [key, value] of Object.entries(DEFAULT_ORG_CONTENT)) {
      if (!(key in orgContentDoc)) missing[key] = value;
    }
    if (Object.keys(missing).length > 0) {
      await db.collection('org_content').updateOne({ _id: 'main' }, { $set: missing });
    }
  }

  const adminDoc = await db.collection('admin_user').findOne({ _id: 'admin' });
  if (!adminDoc) {
    const password = process.env.ADMIN_PASSWORD || 'cambiar-esta-clave';
    const hash = bcrypt.hashSync(password, 10);
    await db.collection('admin_user').insertOne({ _id: 'admin', password_hash: hash });
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '[aviso] No hay ADMIN_PASSWORD en .env: se creó el usuario admin con la clave por defecto ' +
        '"cambiar-esta-clave". Copiá .env.example a .env y definí una clave propia antes de publicar el sitio.'
      );
    }
  }
}

module.exports = { connect, getDb, ObjectId };
