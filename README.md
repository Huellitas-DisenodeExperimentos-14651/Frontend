# HuellitasConectadas — Integración con Neon (Netlify)

Este README explica paso a paso cómo conectar tu proyecto a la base de datos Neon que creó Netlify, cómo poblarla con los datos de `server/db.json` y cómo probar la Netlify Function que lee los datos.

Resumen rápido
- El proyecto incluye:
  - `scripts/import-to-neon.js`: script Node que importa `server/db.json` a Neon creando tablas simples (id TEXT, data JSONB).
  - `netlify/functions/query-neon.js`: Netlify Function que devuelve registros de tablas (pets, users, publications, adoption_requests).
- Variables de entorno necesarias: `NETLIFY_DATABASE_URL` y opcionalmente `NETLIFY_DATABASE_URL_UNPOOLED`.

Requisitos
- Node.js (>=16 recomendado)
- npm
- Acceso a la URL de conexión PostgreSQL provista por Neon/Netlify

Instalación de dependencias
En la raíz del proyecto ejecuta:

```bash
npm install
```

Configurar la variable de entorno (local)
- No incluyas la cadena de conexión en git. Usa variables de entorno.
- En Windows (cmd.exe) establece la variable temporalmente y ejecuta el import:

```cmd
set "NETLIFY_DATABASE_URL=postgresql://USUARIO:PASS@HOST:PORT/DBNAME?sslmode=require" && npm run import-to-neon
```

- En macOS / Linux (bash/zsh):

```bash
export NETLIFY_DATABASE_URL="postgresql://USUARIO:PASS@HOST:PORT/DBNAME?sslmode=require"
npm run import-to-neon
```

Notas sobre la URL de Neon
- Netlify/Neon a menudo expone dos URLs:
  - `NETLIFY_DATABASE_URL` (pooled) — válida para uso general.
  - `NETLIFY_DATABASE_URL_UNPOOLED` (unpooled) — recomendada para funciones serverless porque evita uso de pools compartidos que pueden agotar conexiones.
- En la función `query-neon.js` se intenta usar primero `NETLIFY_DATABASE_URL_UNPOOLED` y luego `NETLIFY_DATABASE_URL`.

Qué hace el script `import-to-neon.js`
- Lee `server/db.json`.
- Para cada colección (clave top-level) que sea un arreglo crea una tabla con nombre saneado (guiones -> guion_bajo).
  - Ejemplo: `adoption-requests` -> `adoption_requests`.
- Cada fila contiene: `id TEXT PRIMARY KEY` y `data JSONB` (donde `data` es el objeto completo).
- Realiza upsert por `id`.

Probar localmente la función (opcional)
- Si quieres probar funciones localmente instala `netlify-cli` globalmente o usa `npx netlify dev`.
- Establece la variable y ejecuta:

Windows (cmd.exe):
```cmd
set "NETLIFY_DATABASE_URL=postgresql://..." && npx netlify dev
```

Linux/macOS:
```bash
export NETLIFY_DATABASE_URL="postgresql://..."
npx netlify dev
```

Probar la función desplegada
- Una vez desplegado en Netlify (y con las env vars configuradas en el panel), prueba con curl:

```bash
curl "https://<tu-sitio>.netlify.app/.netlify/functions/query-neon?collection=pets"
```

La función acepta estas colecciones (whitelist): `pets`, `users`, `publications`, `adoption_requests`.

Respuesta esperada
- La función devuelve un array JSON con los objetos importados (contenido de la columna `data`).

Seguridad y SSL
- El script y la función configuran `ssl: { rejectUnauthorized: false }` para evitar problemas de certificado en ambientes serverless. Esto es práctico para desarrollo y prototipado. Si en producción tienes un CA o certificado propio, configura la verificación correctamente.

Problemas comunes
- ETARGET al hacer `npm install`: ocurrió si se referenciaba `@netlify/neon` (se eliminó); ahora se usa `pg`.
- Error de conexión: verifica que la base no esté caducada/reclamada y que la URL sea correcta.
- Tablas vacías: ejecuta `npm run import-to-neon` localmente con la env var establecida para poblar la BD.

Sugerencias futuras
- Si necesitas consultas por campos (ej. buscar mascotas por nombre), crea columnas y/o índices GIN en `data` o normaliza la estructura en tablas separadas.
- Añadir endpoints para crear/actualizar/eliminar (POST/PUT/DELETE) en `netlify/functions` para manipular los datos desde la app.

Contacto / seguimiento
- Si quieres que genere un endpoint para crear publicaciones o que integre las llamadas desde los servicios Angular al endpoint Netlify, dime cuál prefieres y lo añado.

---
Archivo clave:
- `scripts/import-to-neon.js` — script de importación
- `netlify/functions/query-neon.js` — función para consultar

Fecha: 2025-11-29

