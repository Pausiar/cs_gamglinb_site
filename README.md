# SkinDrop

Web de apertura de cajas de CS2 (simulación, sin dinero real): cajas, upgrader, batallas contra bots e inicio de sesión con Steam.

- **Invitados**: juegan en local; el saldo y el inventario se guardan en `localStorage` del navegador.
- **Usuarios de Steam**: la economía la decide el **servidor**. Cada acción (abrir caja, vender, upgrade, batalla, código promocional) se ejecuta en el servidor con un generador aleatorio criptográfico y se guarda en **PS_Database**. El navegador solo anima el resultado.

## Estructura

```
public/            Sitio estático (lo único que se publica como estático)
  *.html           Una página por sección: index (Inicio), cajas, upgrader, batallas, inventario,
                   estadisticas, recompensas*, ranking*, provably-fair* (*marcadores de posición
                   con su raíz vacía: #rewardsRoot, #leaderboardRoot, #fairRoot), terminos,
                   privacidad, contacto. URLs limpias: /cajas, /ranking...
  favicon.svg
  css/             styles.css (base: cabecera, modal, pie, toasts), home.css, cases.css, stats.css,
                   inventory.css, upgrader.css, battles.css, auth.css, pages.css (textos y "Próximamente")
  js/layout.js     Cabecera, modal de saldo y pie compartidos (se inyectan en #siteHeader / #siteFooter)
  js/sfx.js        Sonidos generados con Web Audio + botón de silencio
  js/app.js        Estado, acciones (window.SkinDrop) y UI de cajas / inventario / estadísticas
  js/data.js       Catálogo de skins y cajas (navegador y Node)
  js/engine.js     Motor del juego puro (navegador y Node)
lib/app.js         Handler HTTP: login de Steam, sesión, API del juego, estáticos (local)
lib/store.js       Almacén de perfiles: PS_Database o memoria, con concurrencia optimista
lib/router.js      Registro de rutas API extra
lib/routes/        Un módulo por funcionalidad nueva de API (index.js lista los módulos)
lib/hooks/         Hooks del juego: makeRng / afterAction (index.js lista los módulos)
server.js          Servidor local (npm start)
api/index.js       Función serverless de Vercel (mismo handler)
scripts/psdb-smoke.js  Prueba contra la API real de PS_Database
test/              Tests (node:test, sin dependencias)
```

### Añadir una página

1. Crea `public/<nombre>.html` copiando una existente: `<body data-page="<nombre>">`, los marcadores `<div id="siteHeader"></div>` / `<div id="siteFooter"></div>`, `js/layout.js` y `js/sfx.js` antes del resto de scripts, y solo los CSS/JS que la página necesite (`app.js` + `auth.js` en todas, para el saldo y el login).
2. Añádela a `NAV` o `FOOTER_LINKS` en `public/js/layout.js` (el enlace activo se marca con `data-page`).
3. Enlaces entre páginas con URLs limpias (`/cajas`); en el HTML estático, `<a href="/cajas" data-page-link="cajas">` para que también funcionen abriendo los archivos desde disco.

`window.SkinDrop` (en `app.js`) es la API para los scripts de cada página: `state`, `actions.*`, `api.get/post`, `refreshState()`, `applyServerState(state)`, `showToast`, etc.

### Extender el servidor (rutas y hooks)

- **Rutas**: `lib/routes/<modulo>.js` exporta `register(router, ctx)` y se añade al array de `lib/routes/index.js`. `router.get/post(path, handler, opts)` y `router.action(path, accion)` aplican la misma seguridad que la API del juego (sesión, mismo origen, JSON, ≤ 10 KB). La cabecera de `lib/routes/index.js` documenta `router`, `ctx` y los handlers.
- **Hooks**: `lib/hooks/<modulo>.js` exporta `install(hooks, ctx)` (array en `lib/hooks/index.js`). `hooks.makeRng({ steamId, profile, action })` devuelve `{ rng, meta }` y lo usa toda acción del juego; si `meta` no es `null` la respuesta incluye `fair: meta`. `hooks.afterAction(evento)` / `hooks.onAfterAction(fn)` se ejecutan tras guardar la acción (sus errores se registran y nunca fallan la petición). Ver `lib/hooks/defaults.js`.

## Ejecutar en local

Requiere Node 22 (sin dependencias, no hace falta `npm install`).

```bash
cp .env.example .env     # rellena SESSION_SECRET (y opcionalmente STEAM_API_KEY / PSDB_*)
npm start                # http://localhost:3000
npm test                 # tests del motor y de la API
```

Sin `PSDB_URL` + `PSDB_API_KEY` el servidor usa un almacén **en memoria** (los perfiles de Steam se pierden al reiniciar). Abrir `public/index.html` directamente (`file://`) también funciona (los enlaces apuntan a los `.html`), pero solo en modo invitado.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SESSION_SECRET` | Sí en producción / Vercel | Firma la cookie `sd_session` (≥ 32 caracteres aleatorios). |
| `BASE_URL` | Recomendada en producción | URL pública sin barra final (return_to de Steam, Origin aceptado, cookies `Secure`). En Vercel, si falta, se deduce de `x-forwarded-proto`/`x-forwarded-host`. |
| `STEAM_API_KEY` | No | Nombre y avatar de Steam. |
| `PSDB_URL` | Sí en Vercel | Base de PS_Database, p. ej. `https://psdatabase.vercel.app`. |
| `PSDB_API_KEY` | Sí en Vercel | Clave de API del proyecto `skindrop`. |
| `PSDB_PROJECT` / `PSDB_TABLE` | No | Por defecto `skindrop` / `profiles`. |
| `PSDB_TIMEOUT_MS` | No | Timeout de cada petición a PS_Database (8000). |
| `PORT` | No | Puerto local (3000). |
| `ALLOW_MEMORY_STORE` | No | `1` permite el almacén en memoria en Vercel (solo pruebas). |

## Desplegar en Vercel

1. Importa el repositorio en Vercel (Framework: *Other*). `vercel.json` ya define:
   - `cleanUrls: true`: `/cajas` sirve `cajas.html` y `/cajas.html` redirige a `/cajas` (el servidor local hace lo mismo).
   - `outputDirectory: "public"` y sin build: solo `public/` se sirve como estático (nunca `lib/`, `server.js`, `scripts/`...).
   - Reescrituras de `/auth/*` y `/api/*` a la función `api/index.js` (que incluye `public/js/**` para cargar el motor).
   - Node 22 vía `engines` de `package.json`.
2. Define las variables `SESSION_SECRET`, `BASE_URL` (p. ej. `https://tu-proyecto.vercel.app`), `PSDB_URL`, `PSDB_API_KEY` y, si quieres, `STEAM_API_KEY`.
3. Despliega y ejecuta una vez `npm run smoke` con esas variables (desde tu máquina o cualquier entorno con acceso a PS_Database) para comprobar el formato de la API (ver abajo).

Las cachés en memoria (nonces de Steam, perfiles de Steam, cola de peticiones por usuario) son por instancia en serverless; la seguridad real la dan `check_authentication` de Steam y la comprobación de versión de PS_Database.

## API

Todas las rutas del juego exigen la cookie de sesión de Steam (`401` si no hay), responden JSON y las `POST` exigen `Content-Type: application/json`, un `Origin` del mismo sitio (`403`) y un cuerpo ≤ 10 KB (`413`). Los errores son `{ "error": "<mensaje en español>", "code": "<código>" }`.

| Ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/me` | – | `{ loggedIn, steamId, name, avatar, profileUrl }` |
| `GET /api/state` | – | `{ steamId, state }` |
| `POST /api/open` | `{ caseId }` | `{ state, result: { caseId, item, rarity }, fair? }` |
| `POST /api/sell` | `{ uids: [...] }` | `{ state, result: { sold, amount } }` |
| `POST /api/upgrade` | `{ uids, balanceStake, targetId, mode: "under"\|"over" }` | `{ state, result: { win, roll, chance, mode, stake, itemsValue, balanceStake, itemCount, staked, target, item } }` |
| `POST /api/battle` | `{ caseIds: [...], mode: "1v1"\|"1v1v1"\|"2v2"\|"1v1v1v1", crazy, botNames? }` | `{ state, result: { mode, crazy, caseIds, seats, rounds, totals, teams, leaders, tiebreak, winnerTeam, won, pot, cost, items } }` |
| `POST /api/promo` | `{ code }` | `{ state, result: { code, amount } }` |

`fair` solo aparece en las acciones del juego cuando un hook `makeRng` devuelve `meta` (por defecto no hay).

`GET /auth/steam?next=/cajas` vuelve a esa página tras el login (solo rutas simples como `/cajas`).

`state = { balance, inventory: [{uid,id,name,price,rarity}], stats: {casesOpened,totalSpent,totalWon,rarityDrops}, history: [...] (máx. 100), promosUsed }`.

Errores de validación del motor → `400`; conflicto de escritura tras 3 intentos → `409`; PS_Database caído → `503`.

### Concurrencia

Cada perfil tiene un número `version`. Una acción lee el perfil (versión N), calcula el nuevo estado y escribe con la condición `steam-id = X AND version = N`, poniendo `version = N+1`. Si no se actualiza ninguna fila (otra petición escribió antes) se relee y se reintenta (máx. 3 veces) y si no, `409`. Además, dentro de una misma instancia las peticiones de un usuario se encolan. Así no se puede gastar dos veces el mismo saldo con peticiones en paralelo.

## PS_Database

Proyecto `skindrop`, tabla `profiles`:

| Columna (slug) | Tipo | Notas |
|---|---|---|
| `steam-id` | text | único, obligatorio |
| `name` | text | nombre de Steam al crear el perfil |
| `balance` | number | euros con 2 decimales (por defecto 0) |
| `inventory` | json | `[{uid,id,name,price,rarity}]` |
| `stats` | json | `{casesOpened,totalSpent,totalWon,rarityDrops}` |
| `history` | json | últimos 100 drops |
| `promos-used` | json | códigos usados |
| `version` | number | concurrencia optimista (por defecto 0) |
| `id`, `created_at`, `updated_at` | – | automáticas |

Peticiones HTTP que hace `lib/store.js` (todas las suposiciones están aisladas y comentadas en la sección *PS_DATABASE* de ese archivo):

- `GET  {PSDB_URL}/api/v1/skindrop/profiles?steam-id=eq.<id>&limit=1` — leer.
- `POST {PSDB_URL}/api/v1/skindrop/profiles` con la fila como objeto JSON — crear (si responde conflicto de unicidad, se relee).
- `PATCH {PSDB_URL}/api/v1/skindrop/profiles?steam-id=eq.<id>&version=eq.<N>` — escritura condicional; el número de filas afectadas se lee de `data.count`, `count`, `data.updated`… o la longitud del array devuelto. Si la respuesta no lo indica, se relee la fila y se comprueba un testigo de escritura (`stats._wid`).
- Cabeceras: `Authorization: Bearer <PSDB_API_KEY>` y `x-api-key: <PSDB_API_KEY>`; respuestas envueltas en `{ "data": ... }`.

`npm run smoke` crea un perfil desechable `test-<aleatorio>`, prueba lectura, inserción, duplicado, PATCH condicional (válido y obsoleto), una carrera de 4 escrituras con la misma versión, imprime exactamente lo que devuelve la API y borra la fila al final.
