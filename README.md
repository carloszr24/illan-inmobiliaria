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
| **Propiedades** | Alta y edición con hasta 30 fotos (se optimizan a WebP), **ubicación en el mapa** (clic, arrastrar o buscar dirección), orden manual, destacadas en portada (máx. 3), archivar / reactivar / eliminar, resumen y búsqueda |
| **Contactos** | Mensajes del formulario y solicitudes de valoración: estado del seguimiento, llamada y WhatsApp en un clic, eliminar |

Acceso con contraseña única. Tras 5 intentos fallidos, la IP queda bloqueada 30 minutos. La sesión es una cookie firmada, `HttpOnly` y `SameSite=Strict`, y caduca a las 12 h.

## Dónde se guardan los datos

Todo vive en la carpeta `data/` (o en `ILLAN_DATA_DIR` si la defines):

```
data/properties.json   propiedades
data/leads.json        contactos recibidos
data/uploads/          fotos subidas desde el panel
```

**Haz copia de seguridad de esa carpeta.** No se versiona (`.gitignore`). Está pensada para **un solo servidor con disco persistente** (VPS, Docker con volumen…). Si algún día hace falta escalar o usar una plataforma sin disco persistente, solo habría que sustituir `src/lib/store/json-store.ts` por una base de datos; el resto de la app no la toca.

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

Vercel no ofrece disco persistente, así que la web arranca en **modo demostración**: todo funciona (web pública, mapas, panel, formularios), pero los cambios del panel —propiedades, fotos y contactos— viven en una carpeta temporal y **se pierden al reiniciarse la instancia**. El panel lo avisa con un banner amarillo.

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

## Pendiente de confirmar con el cliente

- **Logotipo original** (SVG o PNG) y, si los hay, fotos reales de la oficina y de Lugo para el hero.
- **Punto exacto del mapa**: ahora apunta a la Rúa Serra de Outes; hay que afinar `lat`/`lon` a la puerta del nº 25.
- **Datos legales**: forma jurídica y NIF (marcados como PENDIENTE en `src/lib/contact.ts`); revisión de los textos legales por un profesional.
- **Servicios**: confirmar los que ofrece de verdad (p. ej. «Seguros», que aparece en el rótulo de la tienda) y el tono de los textos.
- **Horario de atención** (no se muestra todavía).
- **Aviso por email de nuevos contactos**: hoy los contactos se ven en el panel. Para recibir un correo hay que decidir qué servicio de envío usar (SMTP propio, etc.).
- **Dominio**: `inmobiliariaillan.com` aparece en la tarjeta; define `NEXT_PUBLIC_SITE_URL` cuando esté apuntando a esta web.
