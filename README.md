# TSS Insurance Services

Sitio corporativo completo en Astro 7 y TypeScript. Ocho páginas públicas, contenido en inglés, fuentes locales Manrope y Source Sans 3 y fotografías originales. La versión de revisión es privada y conserva `noindex`.

## Ejecutar

Requiere Node.js **24.x**. En esta máquina se usó Node 24.22.2 descargado del sitio oficial dentro de `.tools/`, sin modificar el Node del sistema.

```sh
npm ci
npm run assets
npm run dev
```

`dev` permite editar Astro con recarga automática. Para comprobar el runtime de producción, API y redirecciones:

```sh
npm run check
npm run build
npm test
npm run preview
```

Preview sirve `http://127.0.0.1:4321/`. Reiniciarlo después de recompilar. Las pruebas de HTML requieren ejecutar el build primero.

## Organización

- `src/components/`: header, footer, servicios, perfiles, contacto, FAQ e imágenes.
- `src/data/`: servicios, equipo, preguntas y datos de la empresa; textos agrupados para una futura traducción. No se presenta selector de idioma.
- `src/styles/global.css`: los diez colores exactos y tokens de fuentes, retícula, radios y espacios.
- `src/lib/validation.ts`: validación compartida entre cliente y servidor.
- `server/`: endpoint real de consultas y router de producción con redirecciones 301.
- `assets/originals/`: material original separado de los derivados públicos.
- `public/images/`: WebP y AVIF de varios tamaños, generados sin ampliar los originales.
- `public/fonts/` y `public/licenses/`: WOFF2 y licencias OFL/MIT.
- `tests/`: pruebas del backend y servidor de prueba local que intercepta todas las llamadas externas.
- `CONTENT_REVIEW.md`: dudas editoriales e integraciones pendientes, fuera del sitio público.

## Formulario

Sin configuración, el sitio muestra llamadas y correo. El formulario no aparece y `/api/inquiry` devuelve 503. Nunca se presenta éxito ficticio.

El runtime solo activa el formulario al encontrar **todos** estos valores del lado servidor:

| Variable | Uso |
|---|---|
| `RESEND_API_KEY` | Clave de un proveedor Resend real. |
| `MAIL_FROM` | Dirección de remitente en un dominio verificado por el negocio. |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS de Redis de Upstash. |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Redis. |
| `RATE_LIMIT_SALT` | Secreto aleatorio de al menos 32 caracteres para HMAC. |

Guardar secretos en las variables del runtime de Vercel/Sites o en un `.env` local ignorado. No añadirlos a variables `PUBLIC_*`, al manifiesto ni al repositorio. No se provisionaron cuentas, servicios de pago o bases de datos.

El endpoint valida los campos, limita cuerpos a 16 KB, comprueba origen, usa honeypot y token firmado con antigüedad de 3 segundos a 30 minutos, y aplica un contador Redis atómico de **5 intentos por hora e IP anonimizada**. Ante fallo del limitador rechaza el envío. No depende de memoria de una sola instancia. La IP debe llegar de una cabecera `CF-Connecting-IP` sobrescrita por un proxy de confianza; el preview usa la IP real del socket. No se debe exponer un proxy que permita falsificar esa cabecera.

Las consultas se envían únicamente a `tssinsuranceservices@gmail.com`, como texto plano, con `reply_to` del visitante e idempotencia. El servidor devuelve éxito únicamente después de una respuesta 2xx con un ID del proveedor. La aceptación del proveedor no garantiza entrega en la bandeja: comprobar entrega real, remitente y carpeta de spam antes de activar producción. Los fallos conservan lo escrito en el navegador. No se registran mensajes o credenciales en logs de la aplicación.

Prueba local del formulario: `node tests/fixture-server.mjs` después del build. Escucha solo en `127.0.0.1:4322`, usa datos ficticios y bloquea todas las llamadas externas. Su primer intento falla y el segundo devuelve una aceptación de prueba. Este servidor nunca se empaqueta ni se publica.

Documentación de referencia: [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), [idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys) y [Redis REST](https://upstash.com/docs/redis/features/restapi).

## Rutas y despliegue

| Página | Ruta |
|---|---|
| Home | `/` |
| Insurance | `/insurance/` |
| Income Tax | `/income-tax/` |
| DMV Services | `/dmv-services/` |
| Real Estate & Mortgage | `/real-estate-mortgage/` |
| Business Formation | `/business-formation/` |
| Our Team | `/our-team/` |
| Contact | `/contact/` |

`/insurance-2`, `/income-tax-2` y `/contact-8`, con o sin barra, redirigen directamente con 301 a su ruta final. Las rutas finales sin barra redirigen una vez a la versión con barra. La query se conserva. No hay páginas HTML intermedias ni redirecciones de cliente. Cada CTA de servicio usa `/contact/?service=<slug>`.

Astro genera HTML estático en `build/client/`. En Vercel, `vercel.json` selecciona `npm run build:client`, esa carpeta de salida y las redirecciones 301. Los archivos `api/inquiry.ts` y `api/inquiry-config.ts` son funciones Node nativas que reutilizan el backend existente; la IP se obtiene de las cabeceras sobrescritas por Vercel y no de una cabecera Cloudflare enviada por el cliente. No se necesita un adaptador SSR ni el Worker de Sites para este despliegue.

Para el alojamiento original, `npm run build` sigue empaquetando el HTML con imágenes, fuentes y API como un Worker ESM en `dist/server/index.js`. El manifiesto `.openai/hosting.json` conserva la identidad de la revisión privada. Ninguno de los dos despliegues incorpora claves en el build.

`SITE_URL` configura canonicals absolutos, Open Graph, JSON-LD y sitemap. En Vercel, si falta, se usa `VERCEL_PROJECT_PRODUCTION_URL` o `VERCEL_URL`; fuera de Vercel se conserva el dominio de revisión. Configurar `SITE_URL` con el dominio definitivo antes del lanzamiento. `PUBLIC_INDEXABLE=false` es la configuración predeterminada y emite meta `noindex` y robots restrictivo; el Worker añade además `X-Robots-Tag`. Establecer `PUBLIC_INDEXABLE=true` y recompilar solo al aprobar la publicación indexable. El sitemap contiene únicamente las ocho rutas finales. No incluye API, errores ni rutas heredadas.

## Decisiones de diseño

Dirección: oficina profesional cercana y organizada; diseño corporativo claro con retícula nativa CSS, sin un sistema visual externo. `DESIGN_VARIANCE=4`, `MOTION_INTENSITY=1`, `VISUAL_DENSITY=5`. Se aplican las dimensiones, tipografías, paleta y composición específicas del encargo sobre los valores genéricos de la guía de diseño. Esto incluye tema claro, footer oliva, header de 88 px, textos y estructura de cinco tarjetas solicitados. No se añaden animaciones de entrada, personas generadas, números ficticios ni se alteran los colores del logo.

Los iconos son Tabler SVG de una sola colección a 1.75 px. La tipografía variable solo declara los rangos usados: 500–700 para Manrope y 400–600 para Source Sans 3, con `font-display: swap`. No hay solicitudes a Google Fonts.

Consultar `VALIDATION.md` para pruebas ejecutadas y límites de verificación.
