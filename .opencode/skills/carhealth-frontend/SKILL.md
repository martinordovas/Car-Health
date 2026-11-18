---
name: Car Health Frontend
description: Úsala para cambios en la app Angular de Car Health: componentes standalone, plantillas, Signals, estilos, i18n ES/EN, stores, servicios HTTP, gráficas, PWA y comportamiento offline.
---

# Car Health: frontend Angular

## Contexto

- Angular 22 con componentes standalone y Signals.
- Tailwind/CSS propio con tokens y estilos globales en `frontend/src/styles.css`.
- Interfaz mobile-first, bilingüe y con soporte offline.
- Los textos viven en `frontend/src/app/i18n/es.json` y `en.json`, con estructura anidada por secciones.

## Antes de editar

1. Busca una pantalla, componente o servicio similar.
2. Revisa si el dato ya está en un store o servicio antes de crear otro.
3. Comprueba el contrato real en `core/models.ts` y en el backend.
4. Identifica si la operación es lectura online, escritura offline o ambas.

## Patrones obligatorios

- Componentes standalone; usa `inject()` para dependencias.
- Estado local con `signal`, `computed` y `effect`; no añadas un store global para algo que pertenece a una pantalla.
- Usa `I18nService` y el pipe `t`; no escribas textos visibles directamente en plantillas o TypeScript.
- Añade cada clave nueva en las dos secciones correspondientes de `es.json` y `en.json`.
- Fechas, moneda, kilómetros, porcentajes y etiquetas de dominio pasan por `core/format.ts`.
- Las peticiones HTTP usan los servicios de `core/`, no `HttpClient` suelto en componentes.
- Las escrituras offline pasan por los servicios que ya generan `clientMutationId` y encolan la operación.
- Respeta los estados de carga, vacío, error, sin conexión y reintento.
- Usa los tokens y clases existentes; evita colores, sombras y radios inventados.
- Las animaciones deben respetar `prefers-reduced-motion`.

## Flujo

1. Modelo y servicio tipado.
2. Store o estado de pantalla.
3. Componente y plantilla.
4. Textos en ambos idiomas.
5. Estados de error/vacío/offline.
6. Comprobación responsive y accesible.
7. `npm test` y `npm run build`.

## Comandos

```bash
cd frontend
npm start
npm test
npm run build
```

No detengas el servidor de desarrollo del usuario sin pedirlo. Si hay un error de caché de Vite, revisa `frontend/.angular/cache` antes de tocar la configuración.

## Reglas

- No dupliques una clave i18n si ya existe.
- No uses `innerHTML` para contenido que venga del usuario.
- No guardes tokens ni datos de negocio en `localStorage` directamente.
- No rompas la cola offline ni el filtrado por usuario.
- No añadas una librería de UI o gráficas sin justificar el peso.
- No cambies estilos globales para resolver un caso aislado; usa una clase o variante local.

## Referencias

- Patrones y archivos clave: `references/frontend-patterns.md`
- Checklist completa: skill `carhealth-feature`, `references/feature-checklist.md`
