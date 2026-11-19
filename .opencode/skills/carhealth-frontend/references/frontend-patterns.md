# Patrones del frontend

## Estructura

```text
frontend/src/app/
├── core/       # Auth, HTTP, stores, modelos, offline, i18n y formato
├── features/   # auth, dashboard, fuel, maintenance, stats, garage
├── i18n/       # Diccionarios es.json y en.json
├── layout/     # Shell, navegación y acciones globales
└── shared/     # Componentes reutilizables, iconos, gráficas y UI
```

## Internacionalización

- Los diccionarios están anidados por secciones:

```json
{
  "dashboard": {
    "emptyTitle": "Tu garaje está esperando.",
    "vehicleToday": "Así va {vehicle} hoy."
  }
}
```

- En plantillas: `{{ 'dashboard.vehicleToday' | t: { vehicle: name } }}`.
- En TypeScript: `this.i18n.t('dashboard.vehicleToday', { vehicle: name })`.
- Añade siempre la misma clave en español e inglés.
- `TranslationKey` se genera a partir del JSON español; si una clave no existe, el build debería avisar.
- Los textos de error del backend se traducen en `core/format.ts`.

## Formato

Usa las utilidades existentes en `core/format.ts` para:

- euros y litros;
- kilómetros y consumo;
- fechas y horas;
- categorías, estados y tipos de combustible;
- etiquetas de mantenimiento.

No formatees con `toFixed()` o `toLocaleString()` directamente en una plantilla si ya existe una función.

## Offline

- `offline-cache.interceptor.ts`: cachea lecturas GET por usuario.
- `offline-store.service.ts`: persistencia en IndexedDB.
- `offline-queue.service.ts`: cola de escrituras pendientes.
- `fuel.service.ts` y `service-record.service.ts`: generan `clientMutationId` y encolan si falla la red.
- `connectivity.service.ts`: estado real de conexión y textos asociados.
- No introduzcas una segunda cola ni otro esquema de caché.

## Componentes y estilos

- Los componentes compartidos viven en `shared/`.
- El selector de fecha y hora es `shared/datetime-picker`; no vuelvas al input nativo. Usa `mode="date"` para fechas sin hora, como las intervenciones de mantenimiento.
- Las gráficas están encapsuladas en `shared/`; no mezcles cálculo y presentación.
- Los estilos globales y tokens están en `styles.css`.
- Mantén el enfoque mobile-first, los focus visibles y el contraste.
- Usa `prefers-reduced-motion` para animaciones no esenciales.

## Tests

- Vitest con jsdom.
- Hay tests de formato, i18n, búsqueda de lugares y componentes.
- Para lógica nueva, añade test unitario si no depende de una integración real.
- Para flujos visuales, Playwright se usa como comprobación manual o script temporal.

```bash
cd frontend
npm test
npm run build
```

## PWA

- El service worker se configura en `ngsw-config.json`.
- No cambies el manifest o la estrategia de caché sin comprobar una build de producción.
- Los accesos rápidos y la instalación deben seguir funcionando tras el cambio.
