# Instrucciones de deploy para HuellitasConectadas

Resumen rápido: la app frontend es estática y en producción necesita saber la URL del backend. Para producción generamos `src/environments/environment.prod.ts` en el momento del build usando la variable de entorno `BACKEND_URL`.

Checklist de lo que hay en el repo (ya aplicado):
- `scripts/generate-env.js` — genera `environment.prod.ts` desde `BACKEND_URL` (se ejecuta como `prebuild`).
- `server/index.js` + `server/package.json` — wrapper para `json-server` que escucha `process.env.PORT` (útil para Render/Railway) y permite correr tu `db.json` localmente.
- `public/_redirects` — regla para Netlify (SPA routing).

Opciones para que la app desplegada use tu DB local en http://localhost:3001

Opción A — Prueba rápida (temporal) con ngrok
1. En tu máquina local, arranca el backend (en la carpeta del repo):

```cmd
cd /d C:\Users\chris\Documents\Avatar\Frontend\server
npm install   # solo la primera vez
npm start     # arranca el json-server wrapper en el puerto 3001
```

2. Abre otro terminal y crea un túnel público con ngrok (instala ngrok previamente):

```cmd
ngrok http 3001
```

3. Ngrok te dará una URL pública como `https://abcd-12-34-56.ngrok.io`. Copia esa URL.
4. En Netlify (o cuando hagas el build localmente), establece la variable de entorno `BACKEND_URL` con esa URL. En Netlify: Site settings -> Build & deploy -> Environment -> Add variable `BACKEND_URL` = `https://abcd-...ngrok.io`.
5. Despliega (o dispara un nuevo deploy). El `prebuild` generará `environment.prod.ts` usando `BACKEND_URL` y la app apuntará a tu `db.json` expuesto por ngrok. IMPORTANTE: ngrok debe estar corriendo mientras Netlify hace el build y mientras quieras que el site use ese backend.

Opción B — Desplegar el backend (recomendado para producción)
- Servicios sencillos: Render, Railway, Fly.io.
- Recomendación (Render):
  1. Crea un nuevo servicio tipo "Web Service" en Render y conecta tu repo.
  2. Ruta a la carpeta del backend: `server/` (o al root si vas a mantener todo junto).
  3. Comando de start: `npm start` (server usa `process.env.PORT`).
  4. Render detectará `package.json` y desplegará. Después tendrás una URL pública como `https://patita-solidaria-backend.onrender.com`.
  5. En Netlify, crea la variable de entorno `BACKEND_URL` con la URL pública y redepliega.

Notas para Railway/Render: asegúrate de que la carpeta `server/` se despliegue y que `npm install` y `npm start` estén configurados; el `db.json` se servirá tal cual (json-server), así que es ideal para prototipos.

Configuración de Netlify (resumen)
- Build command: `npm run build`
- Publish directory: `dist/HuellitasConectadas`
- Environment variable: `BACKEND_URL` = (la URL pública de tu backend, o la de ngrok si pruebas localmente)
- El `prebuild` en `package.json` ejecuta `node scripts/generate-env.js` y genera `src/environments/environment.prod.ts` antes del build, usando `BACKEND_URL`.

Comandos útiles (Windows / cmd.exe)
- Ejecutar backend local:

```cmd
cd /d C:\Users\chris\Documents\Avatar\Frontend\server
npm install
npm start
```

- Probar que responde (desde la raíz del repo):

```cmd
curl -I http://localhost:3001/pets
```

- Generar `environment.prod.ts` manualmente (útil para debug):

```cmd
set BACKEND_URL=https://mi-backend-publico.com && node scripts\generate-env.js
```

- Build local (genera `dist/` usando la variable):

```cmd
set BACKEND_URL=https://mi-backend-publico.com && npm run build
```

Recomendaciones finales
- Si solo estás probando: usa ngrok y configura `BACKEND_URL` en Netlify con la URL de ngrok antes de ejecutar el deploy. Ten en cuenta que Netlify ejecutará el build en la nube; la URL de ngrok debe ser accesible desde internet (normalmente lo es) y ngrok debe estar corriendo.
- Para producción estable, despliega el `server/` en Render o Railway y apunta `BACKEND_URL` a esa URL.

Si quieres, puedo:
- configurar un flujo de GitHub Actions/Netlify que automáticamente despliegue el backend en un servicio y luego la web (más trabajo), o
- ayudarte ahora mismo a crear el deploy de Render paso a paso con los archivos del repo.


