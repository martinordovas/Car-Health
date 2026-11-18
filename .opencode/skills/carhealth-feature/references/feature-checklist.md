# Checklist de una funcionalidad Car Health

## 1. Definición

- [ ] El objetivo está escrito en una frase.
- [ ] Está claro qué pantallas, endpoints y datos cambian.
- [ ] Se han identificado los casos vacío, error, carga y sin conexión.
- [ ] Se ha decidido si necesita migración de base de datos.
- [ ] Se ha comprobado si ya existe una funcionalidad o texto parecido.

## 2. API y backend

- [ ] La ruta sigue `/api/v1/...` y el recurso cuelga del vehículo cuando corresponde.
- [ ] El DTO de entrada usa Jakarta Validation y no expone entidades JPA.
- [ ] El servicio comprueba que el vehículo pertenece al usuario autenticado.
- [ ] Los errores usan el formato `ProblemDetail` existente.
- [ ] Las operaciones con varias escrituras están dentro de una transacción.
- [ ] Los cálculos de negocio tienen tests unitarios o de integración.
- [ ] El endpoint aparece correctamente en OpenAPI si es nuevo.

## 3. Base de datos

- [ ] La migración es un archivo nuevo `Vn__descripcion.sql`; no se ha editado una anterior.
- [ ] Los nombres, tipos, índices y claves foráneas siguen el esquema existente.
- [ ] Funciona en H2 local con `MODE=PostgreSQL` y en PostgreSQL.
- [ ] Si se ha regenerado H2, el usuario lo ha autorizado y los datos demo se han vuelto a crear.
- [ ] El seeder sigue funcionando sin duplicar datos.

## 4. Frontend

- [ ] El modelo TypeScript refleja el contrato real.
- [ ] El servicio HTTP tiene tipos de entrada y salida.
- [ ] La pantalla usa los patrones de carga, error y vacío existentes.
- [ ] La navegación y los guards funcionan.
- [ ] Las escrituras usan la cola offline cuando corresponde.
- [ ] Los formularios muestran errores de campo y mantienen el foco accesible.
- [ ] La vista funciona en móvil y escritorio.

## 5. Textos y formato

- [ ] Todas las cadenas visibles están en `frontend/src/app/i18n/es.json` y `en.json`.
- [ ] Las claves están dentro de la sección anidada correcta.
- [ ] Los textos de TypeScript también pasan por `I18nService`.
- [ ] Fechas, moneda, kilómetros, porcentajes y etiquetas usan `core/format.ts`.
- [ ] No se ha colado jerga técnica en la interfaz de usuario.
- [ ] Los `aria-label`, títulos y placeholders también están traducidos.

## 6. Verificación

- [ ] `cd backend && ./mvnw test`
- [ ] `cd frontend && npm test`
- [ ] `cd frontend && npm run build`
- [ ] `git diff --check`
- [ ] Se ha probado el flujo principal manualmente o con Playwright.
- [ ] Se ha probado en español e inglés.
- [ ] Se ha comprobado que no se rompe el modo offline.
- [ ] Se ha revisado la consola del navegador y los logs del backend.
- [ ] La documentación o las capturas solo se actualizan si era necesario.

## 7. Entrega

- [ ] El resumen explica qué cambió y qué se verificó.
- [ ] Se indican las limitaciones o pasos pendientes.
- [ ] No se han incluido secretos, `.env` ni datos personales.
- [ ] No se han mezclado cambios no relacionados.
