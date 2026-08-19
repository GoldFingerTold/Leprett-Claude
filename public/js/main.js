// Trae el contenido de /api/content y arma toda la página con eso.

function apiUrl(path) {
  return (window.API_BASE || '') + path;
}

function resolveImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return apiUrl(url);
  return url;
}

const SOCIAL_ICONS = {
  whatsapp: '<path d="M16.02 3C9.4 3 4 8.36 4 15c0 2.36.68 4.56 1.86 6.42L4 29l7.77-1.83A11.9 11.9 0 0 0 16.02 27C22.63 27 28 21.64 28 15S22.63 3 16.02 3Zm6.94 16.98c-.3.85-1.72 1.63-2.38 1.7-.63.08-1.4.35-4.68-1.02-3.93-1.65-6.46-5.63-6.66-5.89-.19-.26-1.6-2.13-1.6-4.07 0-1.94.99-2.9 1.35-3.29.35-.4.77-.5 1.02-.5.26 0 .52 0 .74.01.24.02.56-.09.87.68.31.78 1.06 2.7 1.16 2.9.1.19.16.42.03.68-.13.26-.2.42-.4.65-.19.23-.41.51-.58.68-.19.19-.4.4-.17.79.23.4 1.02 1.72 2.2 2.79 1.51 1.38 2.78 1.81 3.17 2.01.4.19.63.16.87-.1.24-.26 1-1.19 1.27-1.6.26-.4.52-.33.87-.19.34.13 2.2 1.06 2.57 1.25.38.19.63.29.72.45.1.16.1.94-.2 1.8Z"/>',
  instagram: '<path d="M16 3.6c3.7 0 4.14.01 5.6.08 1.35.06 2.2.26 2.72.44a5.4 5.4 0 0 1 1.98 1.28 5.4 5.4 0 0 1 1.28 1.98c.18.51.38 1.37.44 2.72.07 1.46.08 1.9.08 5.6s-.01 4.14-.08 5.6c-.06 1.35-.26 2.2-.44 2.72a5.4 5.4 0 0 1-1.28 1.98 5.4 5.4 0 0 1-1.98 1.28c-.51.18-1.37.38-2.72.44-1.46.07-1.9.08-5.6.08s-4.14-.01-5.6-.08c-1.35-.06-2.2-.26-2.72-.44a5.4 5.4 0 0 1-1.98-1.28 5.4 5.4 0 0 1-1.28-1.98c-.18-.51-.38-1.37-.44-2.72-.07-1.46-.08-1.9-.08-5.6s.01-4.14.08-5.6c.06-1.35.26-2.2.44-2.72a5.4 5.4 0 0 1 1.28-1.98 5.4 5.4 0 0 1 1.98-1.28c.51-.18 1.37-.38 2.72-.44C11.86 3.6 12.3 3.6 16 3.6Zm0 2.4c-3.63 0-4.05.01-5.48.08-1.12.05-1.73.24-2.13.39-.54.21-.92.46-1.32.86-.4.4-.65.78-.86 1.32-.15.4-.34 1.01-.39 2.13-.07 1.43-.08 1.85-.08 5.48s.01 4.05.08 5.48c.05 1.12.24 1.73.39 2.13.21.54.46.92.86 1.32.4.4.78.65 1.32.86.4.15 1.01.34 2.13.39 1.43.07 1.85.08 5.48.08s4.05-.01 5.48-.08c1.12-.05 1.73-.24 2.13-.39.54-.21.92-.46 1.32-.86.4-.4.65-.78.86-1.32.15-.4.34-1.01.39-2.13.07-1.43.08-1.85.08-5.48s-.01-4.05-.08-5.48c-.05-1.12-.24-1.73-.39-2.13a3.6 3.6 0 0 0-.86-1.32 3.6 3.6 0 0 0-1.32-.86c-.4-.15-1.01-.34-2.13-.39-1.43-.07-1.85-.08-5.48-.08Zm0 4.1a5.9 5.9 0 1 1 0 11.8 5.9 5.9 0 0 1 0-11.8Zm0 2.4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm6.13-2.68a1.38 1.38 0 1 1-2.76 0 1.38 1.38 0 0 1 2.76 0Z"/>',
  facebook: '<path d="M18.6 28V16.9h3.72l.56-4.32H18.6V9.86c0-1.25.35-2.1 2.14-2.1h2.28V3.9c-.4-.05-1.75-.17-3.32-.17-3.29 0-5.54 2.01-5.54 5.7v3.18H10.4v4.32h3.76V28h4.44Z"/>',
  link: '<path d="M13.4 18.6a1.5 1.5 0 0 1 0-2.12l3-3a1.5 1.5 0 1 1 2.12 2.12l-3 3a1.5 1.5 0 0 1-2.12 0Zm-3.35 3.35 2-2a1.5 1.5 0 1 0-2.12-2.12l-2 2a3.5 3.5 0 0 1-4.95-4.95l4-4a3.5 3.5 0 0 1 4.95 0 1.5 1.5 0 0 0 2.12-2.12 6.5 6.5 0 0 0-9.19 0l-4 4a6.5 6.5 0 0 0 9.19 9.19Zm11.3-11.3a6.5 6.5 0 0 0-9.19 0l-2 2a1.5 1.5 0 1 0 2.12 2.12l2-2a3.5 3.5 0 1 1 4.95 4.95l-4 4a3.5 3.5 0 0 1-4.95 0 1.5 1.5 0 1 0-2.12 2.12 6.5 6.5 0 0 0 9.19 0l4-4a6.5 6.5 0 0 0 0-9.19Z"/>'
};

function socialIconSvg(platform) {
  const path = SOCIAL_ICONS[platform] || SOCIAL_ICONS.link;
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${path}</svg>`;
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

function renderSalones(text) {
  const el = document.getElementById('salones-list');
  if (!el) return;
  el.innerHTML = '';
  paragraphs(text).forEach((name) => {
    const li = document.createElement('li');
    li.textContent = name;
    el.appendChild(li);
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
  items.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const img = document.createElement('img');
    img.src = resolveImageUrl(item.url);
    img.alt = item.alt || 'Salones Leprett';
    img.loading = 'lazy';
    btn.appendChild(img);
    btn.addEventListener('click', () => openLightbox(items, index));
    el.appendChild(btn);
  });
}

function renderSocial(items) {
  const row = document.getElementById('social-row');
  const waFloat = document.getElementById('whatsapp-float');
  if (row) {
    row.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', item.label);
      a.innerHTML = socialIconSvg(item.platform);
      li.appendChild(a);
      row.appendChild(li);
    });
  }
  const whatsapp = items.find((i) => i.platform === 'whatsapp');
  if (waFloat) {
    if (whatsapp) { waFloat.href = whatsapp.url; waFloat.hidden = false; }
    else { waFloat.hidden = true; }
  }
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

// ---------- Formulario de consulta de evento ----------

function initConsultaForm() {
  const form = document.getElementById('consulta-form');
  const status = document.getElementById('form-status');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Enviando...';
    status.className = 'form-status';

    const payload = {
      agasajado: form.agasajado.value.trim(),
      solicitante: form.solicitante.value.trim(),
      localidad: form.localidad.value.trim(),
      telefono: form.telefono.value.trim(),
      celular: form.celular.value.trim(),
      email: form.email.value.trim(),
      tipo_evento: form.tipo_evento.value,
      fecha_evento: form.fecha_evento.value.trim(),
      cantidad_invitados: form.cantidad_invitados.value.trim(),
      comentarios: form.comentarios.value.trim()
    };

    try {
      const res = await fetch(apiUrl('/api/consultas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar la consulta.');

      status.textContent = '¡Gracias! Recibimos tu consulta, te vamos a responder a la brevedad.';
      status.className = 'form-status ok';
      form.reset();
    } catch (err) {
      status.textContent = err.message || 'Ocurrió un error al enviar la consulta.';
      status.className = 'form-status error';
    }
  });
}

// ---------- Carga inicial ----------

async function loadSite() {
  const res = await fetch(apiUrl('/api/content'));
  const { content, gallery, social } = await res.json();

  document.title = content.site_name || 'Salones Leprett';
  setText('nav-brand', content.site_name);
  setText('footer-brand', content.site_name);
  setText('footer-text', content.footer_text);
  document.getElementById('footer-year').textContent = String(new Date().getFullYear());

  const phones = [content.contact_phone, content.contact_phone_2].filter(Boolean).join(' / ');
  const emails = [content.contact_email, content.contact_email_2].filter(Boolean).join(' / ');
  setText('footer-contact', [content.contact_person, phones, emails].filter(Boolean).join(' — '));

  const banner = document.getElementById('banner-image');
  if (banner) banner.src = resolveImageUrl(content.banner_image) || '';
  setText('banner-title', content.banner_title);
  setText('banner-subtitle', content.banner_subtitle);

  const nosotrosImg = document.getElementById('nosotros-image');
  if (nosotrosImg) nosotrosImg.src = resolveImageUrl(content.nosotros_image) || '';
  setText('nosotros-heading', content.nosotros_heading);
  setText('nosotros-subheading', content.nosotros_subheading);
  setParagraphs('nosotros-text', content.nosotros_text);

  setText('instalaciones-heading', content.instalaciones_heading);
  setText('instalaciones-subheading', content.instalaciones_subheading);
  renderSalones(content.instalaciones_salones);

  setText('servicios-heading', content.servicios_heading);
  setText('servicios-subheading', content.servicios_subheading);
  renderServicios(content.servicios_text);

  setText('ubicacion-heading', content.ubicacion_heading);
  setText('ubicacion-subheading', content.ubicacion_subheading);
  setText('ubicacion-text', content.ubicacion_text);
  setText('ubicacion-address', content.ubicacion_address);
  const mapImg = document.getElementById('ubicacion-map-image');
  if (mapImg) mapImg.src = resolveImageUrl(content.ubicacion_map_image) || '';

  setText('contact-heading', content.contact_heading);
  setText('contact-subheading', content.contact_subheading);

  renderNavLabels(content);
  renderGallery(gallery);
  renderSocial(social);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLightbox();
  initConsultaForm();
  loadSite().catch((err) => {
    console.error('No se pudo cargar el contenido del sitio:', err);
  });
});
