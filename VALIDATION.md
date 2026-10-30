# Comprobaciones ejecutadas

Fecha: 30 de octubre de 2026. Entorno: Windows, Node 24.22.2, Astro 7.4.4. Se verificó el Worker de producción en preview local.

| Comprobación | Resultado observado |
|---|---|
| `npm run check` | 0 errores, 0 advertencias y 0 hints en Astro/TypeScript, además de comprobación del código de servidor. |
| `npm run build` | Build completo: ocho páginas finales, página de error, robots, sitemap y Worker ESM con 51 recursos locales. |
| `npm test` | 10 pruebas aprobadas. Validación, disponibilidad de integración, token firmado, origen, honeypot, confirmación del proveedor, rate limit, tamaño de cuerpo, redirecciones y estructura HTML. |
| `npm audit` | 0 vulnerabilidades en el árbol instalado. También se ejecutó `npm audit --omit=dev`: 0 vulnerabilidades. |
| HTTP y enlaces | Ocho páginas 200; veinte destinos internos y recursos encontrados en `href`/`src`, sin enlaces rotos. Teléfono `tel:+17145340070`, correo y cinco rutas de servicio revisados. Facebook conserva la URL proporcionada. |
| Redirecciones | Trece casos verificados en HTTP: rutas antiguas con/sin barra y siete rutas finales sin barra. 301 directo a un destino 200, sin cadenas. Query conservada en pruebas de router. |
| Responsive | Las ocho páginas revisadas en navegador a 375, 768, 1024 y 1440 px: 32 comprobaciones, un H1 por página y 0 px de desbordamiento horizontal. Evidencia en `qa/responsive.json`. |
| Tipografía y fotografía | Familias calculadas en navegador: Manrope y Source Sans 3. Logo y retratos cargados. Hero 4:5, foto móvil de 360 px. Retratos de equipo revisados visualmente: proporciones uniformes y rostros completos. |
| Menús con teclado | Services abre con Enter, cierra con Escape y actualiza `aria-expanded`. Menu móvil abre con Enter; Escape cierra desplegable y navegación. Los enlaces mantienen orden natural de tabulación. |
| Anclas | Tras “Explore Our Services”, header inferior a 125 px, inicio de sección a 144 px y H2 a 232 px. El header no oculta el contenido. |
| FAQ | `details` abierto mediante teclado. Respuestas nativas y divisores horizontales. |
| Preselección | Se pulsó el CTA de cada una de las cinco páginas de servicio. El destino y el valor de `select` coincidieron en los cinco casos. El formulario permanece oculto sin integración. |
| Formulario aislado | Fixture en loopback con toda llamada externa interceptada. Validación sitúa foco en el primer campo erróneo; un fallo conserva nombre, mensaje y servicio; una respuesta de aceptación posterior muestra éxito y limpia los campos. No se envió correo real. |
| Contraste | Veinte combinaciones de colores usadas para texto y botones calculadas con luminancia WCAG, todas ≥4.5:1. Inputs usan borde `--color-muted`; `--color-border` se reserva a divisores decorativos. Evidencia en `qa/build-verification.json`. |
| SEO de revisión | `noindex, nofollow` en HTML y cabeceras; robots restrictivo. Sitemap con las ocho rutas definitivas. Canonicals absolutos configurables. JSON-LD Organization sin dirección, ratings o licencias inventadas. |
| Scripts y consola | Se detectó y corrigió el bloqueo de scripts inline por CSP usando recursos externos. Verificación posterior: sin scripts ejecutables inline y sin errores/advertencias en los logs del navegador revisados. |

Capturas: `qa/home-1440.jpg` y `qa/home-375.jpg`. Las capturas y reportes están fuera de los archivos públicos servidos.

## Límites de la verificación

- Se comprobó el reflujo a 720 px, equivalente al ancho CSS de una ventana de 1440 px con zoom al 200%, sin desbordamiento. La API del navegador integrado no aplicó el zoom nativo solicitado mediante teclado. Falta una comprobación manual del zoom nativo al 200%; no se presenta como aprobada.
- No se ejecutaron Lighthouse ni mediciones de Core Web Vitals. No se declaran métricas de rendimiento. El encargo de tipografías, colores y footer prevalece sobre los valores genéricos de la guía visual.
- No se probó entrega a una bandeja real: faltan el proveedor de correo, el remitente verificado, Redis y los secretos. El sitio público mantiene la alternativa de teléfono y correo.
- Las respuestas del proveedor se probaron con dobles locales; no equivalen a una integración de producción validada. Antes de activar el formulario, probar aceptación y entrega real, error de proveedor, limitación distribuida y política de privacidad aprobada.
- La revisión de teclado, semántica y contraste realizada no constituye una auditoría completa con lectores de pantalla.

Los pendientes editoriales y la preparación del lanzamiento se registran en `CONTENT_REVIEW.md`.

## Corrección de despliegue en Vercel

El error del primer despliegue provenía de importar `vite` directamente sin declararlo como dependencia. La configuración y el preview ahora cargan `.env` mediante las API nativas de Node. Se añadió `vercel.json` para seleccionar `build/client`, los redirects 301 y las funciones Node de consulta; `npm run build` conserva el paquete Worker original. Node queda fijado a la rama 24.x.

Se ejecutó `npm ci --install-strategy=nested` en una copia limpia sin `node_modules` ni archivos de entorno locales. Se comprobó que `node_modules/vite` **no existe en la raíz**. En esa instalación pasaron `npm run build:client`, `npm run check` y las 12 pruebas, incluidas las funciones Vercel y el uso de su IP de proxy frente a una cabecera Cloudflare falsificada. También pasó el build completo del Worker original.

Estas pruebas verifican la corrección local y no equivalen, por sí solas, a la confirmación del despliegue remoto ni a entrega real de correo.
