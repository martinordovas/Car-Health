---
name: Car Health Backend
description: Úsala para cambios en la API Spring Boot de Car Health: controllers, services, repositorios JPA, DTOs, seguridad JWT, migraciones Flyway, correo de verificación y tests de backend.
---

# Car Health: backend Spring Boot

## Contexto

- Java 21 y Spring Boot 4.1.2.
- API REST en `/api/v1`, stateless y autenticada con JWT.
- Arquitectura Controller → Service → Repository.
- PostgreSQL en producción y H2 en modo PostgreSQL para desarrollo local.
- Esquema versionado exclusivamente con Flyway.

## Antes de editar

1. Lee `AGENTS.md` y la skill `carhealth-feature` si el cambio cruza al frontend.
2. Busca el controller, servicio, DTO y test que ya resuelven un caso parecido.
3. Revisa si el recurso pertenece a un vehículo y cómo se comprueba su propiedad.
4. Comprueba si el cambio necesita una migración nueva o solo lógica de servicio.

## Patrones obligatorios

- El usuario se obtiene con `@AuthenticationPrincipal AuthUser`; no se acepta un `userId` del cuerpo o la URL.
- Los controllers reciben y devuelven DTOs; nunca exponen entidades JPA.
- Los DTOs de entrada usan Jakarta Validation y los errores se normalizan a `ProblemDetail`.
- Los servicios comprueban la propiedad del vehículo antes de leer o escribir.
- Las operaciones con varias escrituras van dentro de una transacción.
- Las rutas nuevas se documentan con las anotaciones de Springdoc/OpenAPI.
- Los errores de negocio se lanzan con `ApiException` o una excepción específica que tenga su handler.
- Las migraciones aplicadas no se editan. Crea `V3__descripcion.sql`, `V4__...`, etc.

## Flujo

1. Define el contrato y los permisos.
2. Si hay esquema nuevo, crea la migración y verifica H2/PostgreSQL.
3. Implementa repositorio, servicio y controller en ese orden.
4. Añade tests de integración con H2 en `ApiFlowIntegrationTest` o un test específico.
5. Ejecuta `./mvnw test` desde `backend/`.
6. Si el cambio afecta a la UI, continúa con `carhealth-frontend`.

## Comandos

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

Para el correo local, la skill de funcionalidad puede indicar Mailpit; no actives `MAIL_ENABLED=true` si el servidor SMTP no está levantado.

## Reglas

- No uses `ddl-auto` para crear tablas.
- No imprimas tokens, contraseñas, códigos de verificación completos ni secretos.
- No cambies la configuración de seguridad global sin revisar todos los endpoints.
- No borres la base H2 ni datos de usuario sin confirmación explícita.
- No añadas una dependencia si Spring Boot o Java ya ofrecen una solución razonable.

## Referencias

- Patrones y archivos clave: `references/backend-patterns.md`
- Checklist completa: skill `carhealth-feature`, `references/feature-checklist.md`
