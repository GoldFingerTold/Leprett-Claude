# Sitio web — Salones Leprett

Sitio de una sola página (Inicio, Nosotros, Instalaciones, Servicios, Ubicación,
Contacto) con el contenido real de Salones Leprett, migrado desde el PHP viejo del sitio
anterior. Estilo oscuro elegante con acento esmeralda, panel de administración privado —
mismo stack y patrón que `sitio-celine-stajcer/` y `sitio-lecoin-recepciones/` (Node.js +
Express + `node:sqlite`, sin build).

## Qué tiene de distinto este sitio

- **5 salones con nombre propio** (de los Arcos, Jardín, Espejos, Cristal, de las Luces),
  listados en "Instalaciones" junto a una galería combinada de 32 fotos (una selección de
  las 105 del sitio original — el resto se puede subir después desde el panel).
- **Formulario de "Consulta de evento"** en vez de un contacto genérico: pide agasajado,
  solicitante, localidad, teléfono, celular, email, tipo de evento, fecha y cantidad de
  invitados — igual que el formulario real del sitio anterior, porque es la información
  que de verdad sirve para calificar un pedido de salón de fiestas. El panel tiene una
  pestaña **Consultas** que muestra todos esos campos, no solo un mensaje corto.
- Sin testimonios ni "Próximo evento" (no se pidieron para este sitio).

## Instalación y uso local

Igual que los otros dos proyectos — ver su README para el detalle completo. En resumen:

```
npm install
copy .env.example .env
```

Editá `.env` con `ADMIN_PASSWORD` y `SESSION_SECRET` propios, después:

```
npm start
```

- Sitio público: http://localhost:3000
- Panel: http://localhost:3000/admin

Pestañas del panel: **Textos**, **Fotos** (portada + Nosotros + mapa + galería),
**Redes sociales**, **Consultas** (de eventos), **Cuenta** (cambiar contraseña /
recuperación de emergencia con `ADMIN_RECOVERY_KEY`).

## Despliegue

Mismo camino que los otros dos: misma cuenta de Hostinger, GitHub con auto-deploy.
Repo pendiente de crear. Dominio `salonesleprett.com` a confirmar dónde está registrado.

## Nota

Proyecto construido y probado en local (backend probado por API completo, incluida la
consulta de eventos; capturas de pantalla del sitio público y del panel revisadas) —
**todavía no está desplegado**. Se retoma el despliegue cuando Hugo lo revise y apruebe.
