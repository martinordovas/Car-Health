---
name: Car Health Feature
description: Úsala para implementar o planificar una funcionalidad completa de Car Health que pueda tocar API, base de datos, Angular, i18n, offline y tests. También para cambios de comportamiento que necesiten coordinación entre backend y frontend.
---

# Car Health: funcionalidad completa

## Objetivo

Entregar una funcionalidad coherente de extremo a extremo, no solo un endpoint o una pantalla aislada. Antes de editar, entiende el flujo completo y respeta las decisiones que ya existen en el proyecto.

## Antes de tocar código

1. Lee `AGENTS.md`.
2. Carga las skills `carhealth-backend`, `carhealth-frontend` y `carhealth-qa` cuando la tarea afecte a esas áreas.
3. Revisa el estado de Git y no sobrescribas cambios del usuario.
4. Busca una implementación parecida en el proyecto antes de inventar un patrón nuevo.
5. Identifica si el cambio necesita migración de base de datos, endpoint nuevo, DTO, store, componente, textos i18n o pruebas.

## Flujo de trabajo

1. **Alcance**: escribe qué entra y qué no entra. Si hay varias decisiones válidas, propone la más pequeña que resuelva el problema.
2. **Contrato**: define la ruta, el DTO de entrada/salida, los errores y los permisos. Mantén la API desacoplada y stateless.
3. **Datos**: si hace falta, crea una migración Flyway nueva. Nunca edites una migración ya aplicada. Confirma antes de borrar o regenerar la base H2.
4. **Backend**: implementa controller → service → repository con validación, control de propiedad del vehículo y tests de integración.
5. **Frontend**: añade modelos y servicios tipados; usa los stores existentes y el patrón offline cuando la operación sea una escritura.
6. **Interfaz**: cubre estados de carga, vacío, error y sin conexión. Comprueba móvil, escritorio, teclado y `prefers-reduced-motion`.
7. **Textos**: añade todas las cadenas en `es.json` y `en.json` dentro de su sección anidada. No dejes español hardcodeado en plantillas o TypeScript.
8. **Verificación**: ejecuta tests, build y una comprobación funcional del flujo. Actualiza documentación solo si el comportamiento visible o la API cambian.

## Reglas específicas de este proyecto

- El JWT identifica al usuario; nunca aceptes un `userId` del cliente para decidir la propiedad de un recurso.
- Las mutaciones offline llevan `clientMutationId` y deben pasar por los servicios que ya gestionan la cola.
- No uses `localStorage` directamente para datos de negocio; usa `SessionService`, `OfflineStoreService` o el servicio correspondiente.
- No dupliques textos ni claves i18n: comprueba si ya existe una etiqueta común.
- No cambies el esquema con `ddl-auto`; el esquema se versiona con Flyway.
- No añadas dependencias nuevas sin justificar tamaño, mantenimiento y alternativa nativa.
- Si el cambio es grande, entrega primero un plan y espera aprobación antes de implementar.

## Referencias

- Checklist detallada: `references/feature-checklist.md`
- Convenciones de backend: skill `carhealth-backend`
- Convenciones de frontend: skill `carhealth-frontend`
- Verificación: skill `carhealth-qa`
