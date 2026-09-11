// Página de organizacion.salonesleprett.com: sub-sitio de Alicia manejado desde el
// mismo panel de administración que salonesleprett.com, pero con su propio contenido
// (/api/org-content) y su propio formulario de contacto (/api/org-contact) - no comparte
// datos con el sitio principal, solo el login del panel y este mismo servidor.

function apiUrl(path) {
  return (window.API_BASE || '') + path;
}

function resolveImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return apiUrl(url);
  return url;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

function paragraphs(text) {
  return (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function setParagraphs(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  paragraphs(text).forEach((p) => {
    const para = document.createElement('p');
    para.textContent = p;
    el.appendChild(para);
  });
}

function renderServicios(text) {
  const el = document.getElementById('servicios-list');
  if (!el) return;
  el.innerHTML = '';
  paragraphs(text).forEach((item) => {
    const card = document.createElement('div');
    card.className = 'servicio-card';
    const dot = document.createElement('span');
    dot.className = 'servicio-icon';
    const p = document.createElement('p');
    p.textContent = item;
    card.appendChild(dot);
    card.appendChild(p);
    el.appendChild(card);
  });
}

function renderGallery(items) {
  const el = document.getElementById('gallery');
  if (!el) return;
  el.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'gallery-empty';
    empty.textContent = 'Todavía no hay imágenes cargadas.';
    el.appendChild(empty);
    return;
  }
  items.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const img = document.createElement('img');
    img.src = resolveImageUrl(item.url);
    img.alt = item.alt || 'Organización de Eventos';
    img.loading = 'lazy';
    btn.appendChild(img);
    btn.addEventListener('click', () => openLightbox(items, index));
    el.appendChild(btn);
  });
}

function renderNavLabels(content) {
  document.querySelectorAll('[data-nav-label]').forEach((el) => {
    const key = el.getAttribute('data-nav-label');
    if (content[key]) el.textContent = content[key];
  });
}

// ---------- Lightbox ----------

let lightboxItems = [];
let lightboxIndex = 0;

function openLightbox(items, index) {
  lightboxItems = items;
  lightboxIndex = index;
  updateLightboxImage();
  document.getElementById('lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').hidden = true;
  document.body.style.overflow = '';
}
function updateLightboxImage() {
  const item = lightboxItems[lightboxIndex];
  const img = document.getElementById('lightbox-img');
  img.src = resolveImageUrl(item.url);
  img.alt = item.alt || '';
}
function stepLightbox(delta) {
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  updateLightboxImage();
}
function initLightbox() {
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => stepLightbox(1));
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('lightbox').hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}

// ---------- Nav móvil ----------

function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------- Formulario de contacto ----------

function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: si un bot completó este campo oculto, se descarta en silencio.
    if (form.website.value) return;

    status.textContent = 'Enviando...';
    status.className = 'form-status';

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim()
    };

    try {
      const res = await fetch(apiUrl('/api/org-contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el mensaje.');

      status.textContent = '¡Gracias! Recibimos tu mensaje, te vamos a responder a la brevedad.';
      status.className = 'form-status ok';
      form.reset();
    } catch (err) {
      status.textContent = err.message || 'Ocurrió un error al enviar el mensaje.';
      status.className = 'form-status error';
    }
  });
}

// ---------- Carga inicial ----------

async function loadSite() {
  const res = await fetch(apiUrl('/api/org-content'));
  const { content, gallery } = await res.json();

  document.title = content.site_name || 'Leprett — Organización de Eventos';
  setText('nav-brand', content.site_name);
  setText('footer-brand', content.site_name);
  setText('footer-text', content.footer_text);
  document.getElementById('footer-year').textContent = String(new Date().getFullYear());

  const phones = [content.contact_phone, content.contact_phone_2].filter(Boolean).join(' / ');
  const phoneEmail = [phones, content.contact_email].filter(Boolean).join(' — ');
  setText('footer-contact', phoneEmail);

  const banner = document.getElementById('banner-image');
  if (banner) { banner.src = resolveImageUrl(content.banner_image) || ''; banner.hidden = !content.banner_image; }
  setText('banner-title', content.banner_title);
  setText('banner-subtitle', content.banner_subtitle);

  const nosotrosImg = document.getElementById('nosotros-image');
  if (nosotrosImg) { nosotrosImg.src = resolveImageUrl(content.nosotros_image) || ''; nosotrosImg.hidden = !content.nosotros_image; }
  setText('nosotros-heading', content.nosotros_heading);
  setText('nosotros-subheading', content.nosotros_subheading);
  setParagraphs('nosotros-text', content.nosotros_text);

  setText('servicios-heading', content.servicios_heading);
  setText('servicios-subheading', content.servicios_subheading);
  renderServicios(content.servicios_text);

  setText('imagenes-heading', content.imagenes_heading);
  setText('imagenes-subheading', content.imagenes_subheading);

  setText('contact-heading', content.contact_heading);
  setText('contact-subheading', content.contact_subheading);

  renderNavLabels(content);
  renderGallery(gallery);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLightbox();
  initContactForm();
  loadSite().catch((err) => {
    console.error('No se pudo cargar el contenido de la página:', err);
  });
});
