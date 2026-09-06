// Lógica del panel de administración: login, textos, fotos, redes sociales, consultas
// de eventos y cuenta. Todo habla con /api/admin/*, protegido por sesión.

const FIELD_GROUPS = [
  {
    title: 'General',
    fields: [
      { key: 'site_name', label: 'Nombre del sitio', type: 'text' },
      { key: 'site_tagline', label: 'Bajada / rubro', type: 'text' },
      { key: 'footer_text', label: 'Texto del pie de página', type: 'text' }
    ]
  },
  {
    title: 'Menú de navegación',
    fields: [
      { key: 'nav_home_label', label: 'Etiqueta "Inicio"', type: 'text' },
      { key: 'nav_nosotros_label', label: 'Etiqueta "Nosotros"', type: 'text' },
      { key: 'nav_instalaciones_label', label: 'Etiqueta "Instalaciones"', type: 'text' },
      { key: 'nav_servicios_label', label: 'Etiqueta "Servicios"', type: 'text' },
      { key: 'nav_ubicacion_label', label: 'Etiqueta "Ubicación"', type: 'text' },
      { key: 'nav_telefono_label', label: 'Etiqueta "Teléfono" (lleva al pie de página)', type: 'text' },
      { key: 'nav_contacto_label', label: 'Etiqueta "Contacto"', type: 'text' }
    ]
  },
  {
    title: 'Portada',
    fields: [
      { key: 'banner_title', label: 'Título de la portada', type: 'text' },
      { key: 'banner_subtitle', label: 'Bajada de la portada', type: 'textarea' }
    ]
  },
  {
    title: 'Nosotros',
    fields: [
      { key: 'nosotros_heading', label: 'Título', type: 'text' },
      { key: 'nosotros_subheading', label: 'Antetítulo', type: 'text' },
      { key: 'nosotros_text', label: 'Texto (dejá una línea en blanco entre párrafos)', type: 'textarea' }
    ]
  },
  {
    title: 'Instalaciones',
    fields: [
      { key: 'instalaciones_heading', label: 'Título', type: 'text' },
      { key: 'instalaciones_subheading', label: 'Antetítulo', type: 'text' },
      { key: 'instalaciones_salones', label: 'Nombres de los salones (uno por línea en blanco)', type: 'textarea' }
    ]
  },
  {
    title: 'Servicios',
    fields: [
      { key: 'servicios_heading', label: 'Título', type: 'text' },
      { key: 'servicios_subheading', label: 'Antetítulo', type: 'text' },
      { key: 'servicios_text', label: 'Servicios (uno por párrafo - dejá una línea en blanco entre cada uno)', type: 'textarea' }
    ]
  },
  {
    title: 'Ubicación',
    fields: [
      { key: 'ubicacion_heading', label: 'Título', type: 'text' },
      { key: 'ubicacion_subheading', label: 'Antetítulo', type: 'text' },
      { key: 'ubicacion_text', label: 'Texto', type: 'textarea' },
      { key: 'ubicacion_address', label: 'Dirección', type: 'text' }
    ]
  },
  {
    title: 'Precios (la sección del QR en la portada)',
    fields: [
      { key: 'productos_heading', label: 'Título', type: 'text' },
      { key: 'productos_subheading', label: 'Antetítulo', type: 'text' }
    ]
  },
  {
    title: 'Contacto',
    fields: [
      { key: 'contact_heading', label: 'Título', type: 'text' },
      { key: 'contact_subheading', label: 'Bajada', type: 'text' },
      { key: 'contact_person', label: 'Persona de contacto', type: 'text' },
      { key: 'contact_phone', label: 'Teléfono 1', type: 'text' },
      { key: 'contact_phone_2', label: 'Teléfono 2', type: 'text' },
      { key: 'contact_email', label: 'Email 1', type: 'text' },
      { key: 'contact_email_2', label: 'Email 2', type: 'text' }
    ]
  }
];

function apiUrl(path) {
  return (window.API_BASE || '') + path;
}

function resolveImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return apiUrl(url);
  return url;
}

async function api(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error inesperado.');
  return data;
}

// ---------- Login / sesión ----------

async function checkSession() {
  const { isAdmin } = await api('/api/admin/session');
  if (isAdmin) showApp();
  else showLogin();
}

function showLogin() {
  document.getElementById('login-screen').hidden = false;
  document.getElementById('admin-app').hidden = true;
  document.getElementById('login-form').hidden = false;
  document.getElementById('recover-form').hidden = true;
}

function showApp() {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('admin-app').hidden = false;
  loadContentTab();
  loadFotosTab();
  loadRedesTab();
  loadConsultasTab();
  loadProductosTab();
  initPasswordForm();
}

function initLogin() {
  const form = document.getElementById('login-form');
  const status = document.getElementById('login-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const password = document.getElementById('login-password').value;
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
      document.getElementById('login-password').value = '';
      showApp();
    } catch (err) {
      status.textContent = err.message;
      status.className = 'form-status error';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api('/api/admin/logout', { method: 'POST' });
    showLogin();
  });
}

function initRecovery() {
  const loginForm = document.getElementById('login-form');
  const recoverForm = document.getElementById('recover-form');
  const recoverStatus = document.getElementById('recover-status');

  document.getElementById('forgot-toggle').addEventListener('click', () => {
    loginForm.hidden = true;
    recoverForm.hidden = false;
  });
  document.getElementById('recover-back').addEventListener('click', () => {
    recoverForm.hidden = true;
    loginForm.hidden = false;
    recoverStatus.textContent = '';
  });

  recoverForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    recoverStatus.textContent = '';
    const key = document.getElementById('recover-key').value;
    try {
      await api('/api/admin/recover', { method: 'POST', body: JSON.stringify({ key }) });
      recoverStatus.textContent = 'Listo. Ahora entrá con la contraseña que tenga ADMIN_PASSWORD.';
      recoverStatus.className = 'form-status ok';
      document.getElementById('recover-key').value = '';
    } catch (err) {
      recoverStatus.textContent = err.message;
      recoverStatus.className = 'form-status error';
    }
  });
}

// ---------- Tabs ----------

function initTabs() {
  document.querySelectorAll('.admin-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ---------- Textos ----------

async function loadContentTab() {
  const form = document.getElementById('content-form');
  const { content } = await api('/api/admin/content');

  form.innerHTML = '';
  FIELD_GROUPS.forEach((group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'field-group';
    const h3 = document.createElement('h3');
    h3.textContent = group.title;
    groupEl.appendChild(h3);

    group.fields.forEach((field) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const label = document.createElement('label');
      label.textContent = field.label;
      label.setAttribute('for', `field-${field.key}`);
      wrap.appendChild(label);

      const input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
      input.id = `field-${field.key}`;
      input.name = field.key;
      if (field.type !== 'textarea') input.type = 'text';
      input.value = content[field.key] || '';
      wrap.appendChild(input);

      groupEl.appendChild(wrap);
    });

    form.appendChild(groupEl);
  });

  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  const status = document.createElement('span');
  status.id = 'content-save-status';
  status.className = 'form-status';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Guardar textos';
  saveBar.appendChild(status);
  saveBar.appendChild(saveBtn);
  form.appendChild(saveBar);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const status = document.getElementById('content-save-status');
    status.textContent = 'Guardando...';
    status.className = 'form-status';
    const updates = {};
    FIELD_GROUPS.forEach((group) => {
      group.fields.forEach((field) => {
        updates[field.key] = document.getElementById(`field-${field.key}`).value;
      });
    });
    try {
      await api('/api/admin/content', { method: 'PUT', body: JSON.stringify(updates) });
      status.textContent = 'Guardado ✓';
      status.className = 'form-status ok';
    } catch (err) {
      status.textContent = err.message;
      status.className = 'form-status error';
    }
  };
}

// ---------- Fotos ----------

async function loadFotosTab() {
  const { content } = await api('/api/admin/content');

  document.querySelectorAll('.image-replace').forEach((el) => {
    const key = el.dataset.key;
    const preview = el.querySelector('.image-preview');
    preview.src = resolveImageUrl(content[key]) || '';

    const input = el.querySelector('.image-input');
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', key);
      try {
        const data = await api('/api/admin/content/image', { method: 'POST', body: formData });
        preview.src = resolveImageUrl(data.url);
      } catch (err) {
        alert(err.message);
      } finally {
        input.value = '';
      }
    };
  });

  await loadGalleryAdmin();

  const uploadInput = document.getElementById('gallery-upload-input');
  uploadInput.onchange = async () => {
    const file = uploadInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api('/api/admin/gallery', { method: 'POST', body: formData });
      await loadGalleryAdmin();
    } catch (err) {
      alert(err.message);
    } finally {
      uploadInput.value = '';
    }
  };
}

async function loadGalleryAdmin() {
  const grid = document.getElementById('gallery-admin-grid');
  const { items } = await api('/api/admin/gallery');

  if (items.length === 0) {
    grid.innerHTML = '<p class="empty-state">Todavía no hay fotos en la galería.</p>';
    return;
  }

  grid.innerHTML = '';
  items.forEach((item, index) => {
    const cell = document.createElement('div');
    cell.className = 'gallery-admin-item';

    const img = document.createElement('img');
    img.src = resolveImageUrl(item.url);
    img.alt = item.alt || '';
    cell.appendChild(img);

    const actions = document.createElement('div');
    actions.className = 'gallery-admin-item-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.disabled = index === 0;
    upBtn.onclick = () => moveGalleryItem(items, index, -1);

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.disabled = index === items.length - 1;
    downBtn.onclick = () => moveGalleryItem(items, index, 1);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Borrar';
    delBtn.className = 'danger';
    delBtn.onclick = async () => {
      if (!confirm('¿Borrar esta foto de la galería?')) return;
      await api(`/api/admin/gallery/${item.id}`, { method: 'DELETE' });
      await loadGalleryAdmin();
    };

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(delBtn);
    cell.appendChild(actions);
    grid.appendChild(cell);
  });
}

async function moveGalleryItem(items, index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= items.length) return;
  const order = items.map((i) => i.id);
  [order[index], order[newIndex]] = [order[newIndex], order[index]];
  await api('/api/admin/gallery/reorder', { method: 'PUT', body: JSON.stringify({ order }) });
  await loadGalleryAdmin();
}

// ---------- Redes sociales ----------

async function loadRedesTab() {
  await renderSocialList();

  document.getElementById('social-add-btn').onclick = async () => {
    const platform = prompt('Identificador de la red (ej: instagram, whatsapp, facebook, sitio):');
    if (!platform) return;
    const label = prompt('Nombre visible (ej: Instagram):', platform) || platform;
    const url = prompt('URL completa (ej: https://instagram.com/tuusuario):');
    if (!url) return;
    await api('/api/admin/social', { method: 'POST', body: JSON.stringify({ platform, label, url }) });
    await renderSocialList();
  };
}

async function renderSocialList() {
  const list = document.getElementById('social-list');
  const { items } = await api('/api/admin/social');

  if (items.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay redes sociales cargadas.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'social-row-admin';

    const orderBtns = document.createElement('div');
    orderBtns.className = 'order-btns';
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.textContent = '↑';
    upBtn.disabled = index === 0;
    upBtn.onclick = () => moveSocialItem(items, index, -1);
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.textContent = '↓';
    downBtn.disabled = index === items.length - 1;
    downBtn.onclick = () => moveSocialItem(items, index, 1);
    orderBtns.appendChild(upBtn);
    orderBtns.appendChild(downBtn);

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = item.label;
    labelInput.placeholder = 'Nombre visible';

    const urlInput = document.createElement('input');
    urlInput.type = 'url';
    urlInput.value = item.url;
    urlInput.placeholder = 'https://...';

    const visibleLabel = document.createElement('label');
    visibleLabel.style.display = 'flex';
    visibleLabel.style.alignItems = 'center';
    visibleLabel.style.gap = '6px';
    visibleLabel.style.fontSize = '0.82rem';
    const visibleCheckbox = document.createElement('input');
    visibleCheckbox.type = 'checkbox';
    visibleCheckbox.checked = Boolean(item.visible);
    visibleLabel.appendChild(visibleCheckbox);
    visibleLabel.appendChild(document.createTextNode('Visible'));

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'icon-btn';
    saveBtn.title = 'Guardar';
    saveBtn.textContent = '💾';
    saveBtn.onclick = async () => {
      await api(`/api/admin/social/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          platform: item.platform,
          label: labelInput.value,
          url: urlInput.value,
          visible: visibleCheckbox.checked
        })
      });
      saveBtn.textContent = '✓';
      setTimeout(() => (saveBtn.textContent = '💾'), 1200);
    };

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn danger';
    delBtn.title = 'Borrar';
    delBtn.textContent = '🗑';
    delBtn.onclick = async () => {
      if (!confirm(`¿Borrar la red "${item.label}"?`)) return;
      await api(`/api/admin/social/${item.id}`, { method: 'DELETE' });
      await renderSocialList();
    };

    row.appendChild(orderBtns);
    row.appendChild(labelInput);
    row.appendChild(urlInput);
    row.appendChild(visibleLabel);
    row.appendChild(saveBtn);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

async function moveSocialItem(items, index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= items.length) return;
  const order = items.map((i) => i.id);
  [order[index], order[newIndex]] = [order[newIndex], order[index]];
  await api('/api/admin/social/reorder', { method: 'PUT', body: JSON.stringify({ order }) });
  await renderSocialList();
}

// ---------- Consultas de eventos ----------

async function loadConsultasTab() {
  const list = document.getElementById('consultas-list');
  const { items } = await api('/api/admin/consultas');

  if (items.length === 0) {
    list.innerHTML = '<p class="empty-state">Todavía no llegó ninguna consulta.</p>';
    return;
  }

  list.innerHTML = '';
  items.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'consulta-item' + (c.is_read ? '' : ' unread');

    // Mongo serializa el Date como ISO ("2026-09-05T03:04:44.635Z") al pasar por JSON -
    // a diferencia del texto plano que devolvía SQLite, ya viene listo para new Date().
    const date = new Date(c.created_at).toLocaleString('es-AR');
    const contacto = [c.telefono, c.celular, c.email].filter(Boolean).join(' · ');

    el.innerHTML = `
      <div class="consulta-item-head">
        <strong>${escapeHtml(c.agasajado)}</strong>
        <span class="consulta-item-meta">${date}</span>
      </div>
      <div class="consulta-grid">
        <div><span>Solicitante</span>${escapeHtml(c.solicitante)}</div>
        <div><span>Localidad</span>${escapeHtml(c.localidad) || '-'}</div>
        <div><span>Tipo de evento</span>${escapeHtml(c.tipo_evento) || '-'}</div>
        <div><span>Fecha</span>${escapeHtml(c.fecha_evento)}</div>
        <div><span>Invitados</span>${escapeHtml(c.cantidad_invitados)}</div>
        <div><span>Contacto</span>${escapeHtml(contacto)}</div>
      </div>
      ${c.comentarios ? `<p>${escapeHtml(c.comentarios)}</p>` : ''}
    `;

    const actions = document.createElement('div');
    actions.className = 'consulta-item-actions';

    if (!c.is_read) {
      const readBtn = document.createElement('button');
      readBtn.textContent = 'Marcar como leída';
      readBtn.onclick = async () => {
        await api(`/api/admin/consultas/${c.id}/read`, { method: 'PUT' });
        await loadConsultasTab();
      };
      actions.appendChild(readBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Borrar';
    delBtn.onclick = async () => {
      if (!confirm('¿Borrar esta consulta?')) return;
      await api(`/api/admin/consultas/${c.id}`, { method: 'DELETE' });
      await loadConsultasTab();
    };
    actions.appendChild(delBtn);

    el.appendChild(actions);
    list.appendChild(el);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---------- Precios / productos (categorías + items, y el QR que apunta a /productos) ----------

async function loadProductosTab() {
  document.getElementById('qr-preview').src = '/api/products/qr';

  await renderCategoriesList();

  document.getElementById('category-add-form').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('category-name-input');
    const name = input.value.trim();
    if (!name) return;
    await api('/api/admin/product-categories', { method: 'POST', body: JSON.stringify({ name }) });
    input.value = '';
    await renderCategoriesList();
  };
}

async function renderCategoriesList() {
  const list = document.getElementById('categories-list');
  const [{ items: categories }, { items: allProducts }] = await Promise.all([
    api('/api/admin/product-categories'),
    api('/api/admin/products')
  ]);

  if (categories.length === 0) {
    list.innerHTML = '<p class="empty-state">Todavía no hay categorías - agregá la primera arriba.</p>';
    return;
  }

  list.innerHTML = '';
  categories.forEach((cat, catIndex) => {
    const catProducts = allProducts.filter((p) => String(p.categoryId) === String(cat.id));

    const card = document.createElement('div');
    card.className = 'category-card';

    const header = document.createElement('div');
    header.className = 'category-card-header';

    const orderBtns = document.createElement('div');
    orderBtns.className = 'order-btns';
    const catUp = document.createElement('button');
    catUp.type = 'button';
    catUp.textContent = '↑';
    catUp.disabled = catIndex === 0;
    catUp.onclick = () => moveCategoryItem(categories, catIndex, -1);
    const catDown = document.createElement('button');
    catDown.type = 'button';
    catDown.textContent = '↓';
    catDown.disabled = catIndex === categories.length - 1;
    catDown.onclick = () => moveCategoryItem(categories, catIndex, 1);
    orderBtns.appendChild(catUp);
    orderBtns.appendChild(catDown);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = cat.name;
    nameInput.className = 'category-name-input';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'icon-btn';
    saveBtn.title = 'Guardar nombre';
    saveBtn.textContent = '💾';
    saveBtn.onclick = async () => {
      await api(`/api/admin/product-categories/${cat.id}`, { method: 'PUT', body: JSON.stringify({ name: nameInput.value }) });
      saveBtn.textContent = '✓';
      setTimeout(() => (saveBtn.textContent = '💾'), 1200);
    };

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn danger';
    delBtn.title = 'Borrar categoría';
    delBtn.textContent = '🗑';
    delBtn.onclick = async () => {
      if (!confirm(`¿Borrar la categoría "${cat.name}" y todos sus productos?`)) return;
      await api(`/api/admin/product-categories/${cat.id}`, { method: 'DELETE' });
      await renderCategoriesList();
    };

    header.appendChild(orderBtns);
    header.appendChild(nameInput);
    header.appendChild(saveBtn);
    header.appendChild(delBtn);
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'products-admin-grid';
    catProducts.forEach((p, pIndex) => grid.appendChild(renderProductAdminItem(p, catProducts, pIndex)));
    if (catProducts.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Sin productos todavía.';
      grid.appendChild(empty);
    }
    card.appendChild(grid);

    const addForm = document.createElement('form');
    addForm.className = 'inline-form product-add-form';
    const nameField = document.createElement('input');
    nameField.type = 'text';
    nameField.placeholder = 'Nombre del producto';
    nameField.required = true;
    const priceField = document.createElement('input');
    priceField.type = 'text';
    priceField.placeholder = 'Precio (ej: $150.000)';
    const addBtn = document.createElement('button');
    addBtn.type = 'submit';
    addBtn.className = 'btn-ghost';
    addBtn.textContent = '+ Agregar producto';
    addForm.appendChild(nameField);
    addForm.appendChild(priceField);
    addForm.appendChild(addBtn);
    addForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = nameField.value.trim();
      if (!name) return;
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ category_id: cat.id, name, price: priceField.value.trim() })
      });
      await renderCategoriesList();
    };
    card.appendChild(addForm);

    list.appendChild(card);
  });
}

function renderProductAdminItem(p, catProducts, pIndex) {
  const item = document.createElement('div');
  item.className = 'product-admin-item';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'product-admin-image';
  const img = document.createElement('img');
  img.src = resolveImageUrl(p.image) || '';
  img.hidden = !p.image;
  imgWrap.appendChild(img);

  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'btn-ghost file-btn small';
  uploadLabel.textContent = p.image ? 'Cambiar foto' : 'Subir foto';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('productId', p.id);
    try {
      const data = await api('/api/admin/products/image', { method: 'POST', body: formData });
      img.src = resolveImageUrl(data.url);
      img.hidden = false;
      uploadLabel.childNodes[0].textContent = 'Cambiar foto';
    } catch (err) {
      alert(err.message);
    } finally {
      fileInput.value = '';
    }
  };
  uploadLabel.appendChild(fileInput);
  imgWrap.appendChild(uploadLabel);
  item.appendChild(imgWrap);

  const fields = document.createElement('div');
  fields.className = 'product-admin-fields';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = p.name;
  nameInput.placeholder = 'Nombre';
  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.value = p.price || '';
  priceInput.placeholder = 'Precio';
  fields.appendChild(nameInput);
  fields.appendChild(priceInput);
  item.appendChild(fields);

  const actions = document.createElement('div');
  actions.className = 'product-admin-actions';

  const orderBtns = document.createElement('div');
  orderBtns.className = 'order-btns';
  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.textContent = '↑';
  upBtn.disabled = pIndex === 0;
  upBtn.onclick = () => moveProductItem(catProducts, pIndex, -1);
  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.textContent = '↓';
  downBtn.disabled = pIndex === catProducts.length - 1;
  downBtn.onclick = () => moveProductItem(catProducts, pIndex, 1);
  orderBtns.appendChild(upBtn);
  orderBtns.appendChild(downBtn);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'icon-btn';
  saveBtn.title = 'Guardar';
  saveBtn.textContent = '💾';
  saveBtn.onclick = async () => {
    await api(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: nameInput.value, price: priceInput.value })
    });
    saveBtn.textContent = '✓';
    setTimeout(() => (saveBtn.textContent = '💾'), 1200);
  };

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'icon-btn danger';
  delBtn.title = 'Borrar';
  delBtn.textContent = '🗑';
  delBtn.onclick = async () => {
    if (!confirm(`¿Borrar "${p.name}"?`)) return;
    await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    await renderCategoriesList();
  };

  actions.appendChild(orderBtns);
  actions.appendChild(saveBtn);
  actions.appendChild(delBtn);
  item.appendChild(actions);

  return item;
}

async function moveCategoryItem(categories, index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= categories.length) return;
  const order = categories.map((c) => c.id);
  [order[index], order[newIndex]] = [order[newIndex], order[index]];
  await api('/api/admin/product-categories/reorder', { method: 'PUT', body: JSON.stringify({ order }) });
  await renderCategoriesList();
}

async function moveProductItem(products, index, delta) {
  const newIndex = index + delta;
  if (newIndex < 0 || newIndex >= products.length) return;
  const order = products.map((p) => p.id);
  [order[index], order[newIndex]] = [order[newIndex], order[index]];
  await api('/api/admin/products/reorder', { method: 'PUT', body: JSON.stringify({ order }) });
  await renderCategoriesList();
}

// ---------- Cuenta (cambiar contraseña) ----------

function initPasswordForm() {
  const form = document.getElementById('password-form');
  const status = document.getElementById('password-status');

  form.onsubmit = async (e) => {
    e.preventDefault();
    status.textContent = '';

    const currentPassword = document.getElementById('pw-current').value;
    const newPassword = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (newPassword !== confirm) {
      status.textContent = 'Las dos contraseñas nuevas no coinciden.';
      status.className = 'form-status error';
      return;
    }

    try {
      await api('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      status.textContent = 'Contraseña actualizada ✓ - usála la próxima vez que entres.';
      status.className = 'form-status ok';
      form.reset();
    } catch (err) {
      status.textContent = err.message;
      status.className = 'form-status error';
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initRecovery();
  initTabs();
  checkSession();
});
