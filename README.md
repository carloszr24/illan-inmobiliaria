# ILLAN Inmobiliaria — Web y panel de administración

Web de ILLAN Inmobiliaria (Lugo) con catálogo de propiedades (en lista y en mapa), formularios de contacto y valoración, mapa de la oficina y panel de administración. Diseño con los colores de la tarjeta de visita (verde y amarillo).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Leaflet + OpenStreetMap.
**Sin servicios externos:** la web no depende de GitHub, Supabase, Vercel, Google Maps ni ninguna API con clave. Todo se instala desde el registro oficial de npm.

---

## Arranque en local

Requiere Node 20.9 o superior.

```bash
npm install
npm run setup      # crea .env.local con contraseña de admin y secreto de sesión ALEATORIOS
npm run dev        # http://localhost:3000
```

- `npm run setup` **no imprime la contraseña**: está en `.env.local` (variable `ADMIN_PASSWORD`). Ese archivo está en `.gitignore`.
- La primera vez que arranca, la web crea `data/` con **6 inmuebles y 3 contactos de ejemplo** para poder enseñar el diseño.

## Panel de administración — `/admin`

| Sección | Qué permite |
| --- | --- |
| **Propiedades** | Alta y edición con tantas fotos como quieras (se reducen y optimizan a WebP) y **consejos en vivo** para título, descripción y fotos (avisan, nunca bloquean), **ubicación en el mapa** (clic, arrastrar o buscar dirección), **nombre y teléfono del propietario** (datos internos: no se publican), orden manual, destacadas en portada (máx. 3), archivar / reactivar / eliminar, resumen y búsqueda |
| **Contactos** | Mensajes del formulario y solicitudes de valoración: estado del seguimiento, llamada y WhatsApp en un clic, eliminar |

Acceso con contraseña única. Tras 5 intentos fallidos, la IP queda bloqueada 30 minutos. La sesión es una cookie firmada, `HttpOnly` y `SameSite=Strict`, y caduca a las 12 h.

## Dónde se guardan los datos (motor local)

Sin Supabase configurado, todo vive en la carpeta `data/` (o en `ILLAN_DATA_DIR` si la defines):

```
data/properties.json   propiedades
data/leads.json        contactos recibidos
data/uploads/          fotos subidas desde el panel
```

**Haz copia de seguridad de esa carpeta.** No se versiona (`.gitignore`). Está pensada para **un solo servidor con disco persistente** (VPS, Docker con volumen…). Si algún día hace falta escalar o usar una plataforma sin disco persistente, solo habría que sustituir `src/lib/store/json-store.ts` por una base de datos; el resto de la app no la toca.

## Base de datos, fotos y avisos por email (Supabase + Resend)

La web tiene **dos motores de datos intercambiables**. Se elige solo, según las variables de entorno:

| Motor | Cuándo se usa | Dónde guarda |
| --- | --- | --- |
| **Local (JSON)** | Faltan `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY` | Carpeta `data/` (en Vercel, una carpeta temporal: los cambios se pierden al reiniciar) |
| **Supabase** | Están las dos variables | Postgres (propiedades, contactos, límite de intentos) y Storage (fotos) |

Además, si existe `RESEND_API_KEY`, cada contacto nuevo genera un **correo de aviso** al equipo. El resultado (enviado / falló / sin configurar) se guarda en el propio contacto y se ve en **/admin → Contactos**, para que un fallo no pase desapercibido.

### Variables de entorno (solo nombres; los valores van en `.env.local` o en Vercel, nunca en el código)

| Variable | Para qué sirve | Obligatoria |
| --- | --- | --- |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Acceso al panel (≥ 32 caracteres para el secreto) | Sí |
| `SUPABASE_URL` | `https://<proyecto>.supabase.co` | Para usar Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role` (o la *secret key* nueva). **Solo servidor**: jamás con prefijo `NEXT_PUBLIC_` | Para usar Supabase |
| `RESEND_API_KEY` | Clave de la API de Resend | Para los avisos |
| `RESEND_FROM_EMAIL` | Remitente, p. ej. `ILLAN Inmobiliaria <avisos@tudominio.com>` | Recomendada |
| `LEADS_NOTIFICATION_EMAIL` | Destinatarios (varios, separados por coma). Por defecto, el correo de contacto de la web | No |

En Vercel márcalas como **Sensitive** y define `SUPABASE_*`, `RESEND_*` y `ADMIN_*` en Production **y** Preview. Después de cambiar variables hay que hacer *Redeploy*.

### Puesta en marcha: quién hace qué

| # | Paso | Quién |
| --- | --- | --- |
| 1 | Crear cuenta y proyecto **nuevo** en Supabase, **región de la UE**. No reutilizar el proyecto de otro cliente. Guardar la contraseña de la base de datos | Persona |
| 2 | Supabase → *SQL Editor* → pegar y ejecutar **`supabase/schema.sql`** entero (es idempotente; crea tablas, seguridad, límite de intentos y el bucket de fotos) | Persona |
| 3 | Supabase → *Project Settings → API*: copiar la URL y la clave `service_role` a Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) | Persona |
| 4 | Crear cuenta en **Resend** con el correo que recibirá los avisos (para las pruebas iniciales, con `onboarding@resend.dev`, solo llegan al titular de la cuenta) | Persona |
| 5 | Para producción: *Domains → Add domain* en Resend y añadir los registros DNS (SPF, DKIM, DMARC) donde esté el DNS del dominio; esperar a «Verified» | Persona |
| 6 | Vercel: añadir `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `LEADS_NOTIFICATION_EMAIL`; *Redeploy* | Persona |
| 7 | Entrar en `/admin`: si el catálogo está vacío aparece el botón **Cargar inmuebles de ejemplo** (opcional) | Persona |
| 8 | Prueba de punta a punta: crear una propiedad con foto, enviar el formulario de contacto, comprobar que llega el correo (mira también *spam*) y que el contacto muestra «Aviso enviado» | Ambos |

### Seguridad del diseño

- **RLS activada sin políticas**: la clave pública (`anon`) no puede leer ni escribir nada en las tablas; los datos del propietario y los contactos no se pueden consultar saltándose la web. Todo el acceso es desde el servidor con la clave de servicio.
- **El navegador nunca habla con Supabase.** Las fotos se suben a través de la API de la web (se reducen en el navegador, se optimizan a WebP en el servidor y se guardan en el bucket público `property-images`).
- El **límite de intentos** (login: 5 fallos → 30 min de bloqueo; formularios: 5 por hora) es persistente y atómico en Supabase, y cae a memoria si Supabase no responde.
- Si Resend falla, **el contacto ya está guardado**; el fallo queda anotado en el contacto y no se pierde ningún aviso.
- Al borrar una propiedad se borran también sus fotos de Storage.

### Qué está comprobado y qué falta

- **Comprobado**: el motor JSON y el motor Supabase superan el mismo conjunto de 35-36 pruebas de API (alta, duplicados, fotos, archivar, reordenar, borrar, contactos, límite de intentos, datos del propietario ocultos al público). El motor Supabase se probó contra un servidor simulado con el SDK real, y **`supabase/schema.sql` se ejecutó en un PostgreSQL 18 real** (dos veces, sin errores) verificando RLS, restricciones y las funciones del límite de intentos. El camino de error de Resend (clave inválida) también.
- **Falta con cuentas reales**: la primera conexión a un proyecto de Supabase real (comportamiento de PostgREST/Storage en vivo), y el envío correcto de un correo con Resend (dominio verificado y llegada a la bandeja principal). Hasta hacer el paso 8 no hay que dar el correo por bueno.
- **Límites a tener en cuenta**: los planes gratuitos tienen restricciones (pausa por inactividad en Supabase, sin copias descargables automáticas; cuota mensual de correos en Resend): revisa el plan vigente. Las copias de seguridad hay que organizarlas (Supabase → *Database → Backups*, o `pg_dump`) y el catálogo se lee con un máximo de 1000 filas por consulta.

### Mapa de propiedades

Cada inmueble puede tener ubicación (latitud/longitud). Se coloca en el panel, dentro de la ficha: clic en el mapa, arrastrar el marcador o «Buscar» la dirección. En la web, **/propiedades → Mapa** muestra todos los inmuebles filtrados (verde = venta, amarillo = alquiler) y cada ficha incluye su mapa. Los inmuebles sin ubicación no salen en el mapa (el panel los marca como «Sin mapa»). Si el propietario prefiere discreción, basta con colocar el punto de forma aproximada.

### Quitar los datos de ejemplo antes de publicar

1. En `/admin`: archivar y eliminar los inmuebles marcados como **Ejemplo**, y borrar los contactos de ejemplo.
2. Para que una instalación nueva arranque vacía, deja en `[]` los arrays de `src/data/demo-properties.ts` y `src/data/demo-leads.ts`.

## Sin GitHub y sin claves en el código

- La web **no depende de GitHub**: no hay `.github/` ni dependencias que se descarguen de allí (todo viene de `registry.npmjs.org`). El repositorio de GitHub es solo una copia del código; se puede borrar o cambiar sin que la web lo note.
- No hay claves, contraseñas ni PIN en el código. Las únicas credenciales son `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET`, que salen de variables de entorno. Si faltan, el login queda **desactivado** (no existe ningún valor por defecto).
- `.env.example` va vacío a propósito. `.env*` está ignorado por git.
- Los mapas usan teselas públicas de OpenStreetMap (sin cuenta, sin clave). El buscador de direcciones del panel usa Nominatim, también de OpenStreetMap, y solo se consulta al pulsar «Buscar».
- Las fuentes (DM Sans y Source Serif 4) se sirven desde `node_modules`, no desde Google Fonts.

Para comprobarlo en cualquier momento:

```bash
npm run audit:repo
```

Revisa patrones de claves en el código, que `.env.example` esté vacío, que `package.json` y `package-lock.json` solo apunten al registro de npm, que no exista `.github/`, que git no versione archivos `.env` y que ningún remoto lleve un token en la URL.

## Demo en Vercel (para enseñar el diseño)

Vercel no ofrece disco persistente, así que la web arranca en **modo demostración**: todo funciona (web pública, mapas, panel, formularios), pero los cambios del panel —propiedades, fotos y contactos— viven en una carpeta temporal y **se pierden al reiniciarse la instancia**.

1. Importa el repositorio en Vercel (detecta Next.js solo; no hay que cambiar el comando de build).
2. En **Settings → Environment Variables** define `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` (mínimo 32 caracteres aleatorios; se pueden copiar del `.env.local`). Sin ellas la web pública funciona, pero el panel queda desactivado.
3. Vuelve a desplegar (*Redeploy*) para que las variables se apliquen.

Para el lanzamiento real usa un servidor con disco persistente (siguiente sección). Fotos de más de 4,5 MB no se pueden subir en Vercel (límite de la plataforma).

## Despliegue en servidor propio (producción)

```bash
npm ci
npm run build
npm run start          # puerto 3000; usa -- -p 8080 para cambiarlo
```

En un VPS con Node: crea `.env.local` (o define las variables de entorno), mantén el proceso con `systemd` o `pm2`, y pon **Nginx o Caddy delante con HTTPS** (la cookie del admin es `Secure` en producción, así que sin HTTPS no se puede iniciar sesión). Si Nginx es el único acceso, define `ADMIN_ALLOWED_IPS` solo si quieres limitar el panel a ciertas IPs.

Las subidas y los datos van a `data/`: móntalo como volumen si usas Docker.

## Personalizar

| Qué | Dónde |
| --- | --- |
| Colores corporativos | `src/app/globals.css` (bloque `:root`, valores RGB) |
| Logotipo | `src/components/brand/Logo.tsx` (recreado en SVG desde la tarjeta; sustituible por el archivo original) |
| Teléfono, email, dirección, coordenadas del mapa | `src/lib/contact.ts` |
| Servicios y pasos de «Cómo trabajamos» | `src/data/services.ts` |
| Textos legales | `src/app/aviso-legal`, `politica-privacidad`, `politica-cookies` |

## Créditos de imágenes

| Imagen | Autor | Licencia |
| --- | --- | --- |
| Foto de portada: [Ayuntamiento de Lugo](https://commons.wikimedia.org/wiki/File:Lugo_City_Hall_2.jpg) (`public/images/lugo-ayuntamiento.webp`) | Joseolgon, vía Wikimedia Commons | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

La licencia exige citar al autor, enlazar la licencia e indicar los cambios (aquí: redimensionada, difuminada y teñida de verde). El crédito sale en el pie de la web y se define en `src/data/credits.ts`; si se cambia la foto, hay que actualizarlo. Se guarda solo la versión ligera (2000 px, sin metadatos EXIF); el original de 6,9 MB no está en el repositorio. Las ilustraciones de los inmuebles de ejemplo son propias.

## Pendiente de confirmar con el cliente

- **Logotipo original** (SVG o PNG) y, si los hay, fotos reales de la oficina y de Lugo para el hero.
- **Punto exacto del mapa**: ahora apunta a la Rúa Serra de Outes; hay que afinar `lat`/`lon` a la puerta del nº 25.
- **Datos legales**: forma jurídica y NIF (marcados como PENDIENTE en `src/lib/contact.ts`); revisión de los textos legales por un profesional.
- **Servicios**: confirmar los que ofrece de verdad (p. ej. «Seguros», que aparece en el rótulo de la tienda) y el tono de los textos.
- **Horario de atención** (no se muestra todavía).
- **Aviso por email de nuevos contactos**: hoy los contactos se ven en el panel. Para recibir un correo hay que decidir qué servicio de envío usar (SMTP propio, etc.).
- **Dominio**: `inmobiliariaillan.com` aparece en la tarjeta; define `NEXT_PUBLIC_SITE_URL` cuando esté apuntando a esta web.
