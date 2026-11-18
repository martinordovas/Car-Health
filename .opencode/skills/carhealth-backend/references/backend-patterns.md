# Patrones del backend

## Estructura

```text
backend/src/main/java/com/carhealth/api/
├── config/       # Seguridad, OpenAPI, datos demo
├── controller/   # Endpoints REST
├── domain/       # Entidades JPA y enums
├── dto/          # Records de entrada y salida
├── error/        # ApiException y ProblemDetail
├── repository/   # Spring Data JPA
├── security/     # JWT, filtro y AuthUser
└── service/      # Lógica de negocio, estadísticas y PDF
```

## Seguridad

- El filtro JWT crea un `AuthUser`.
- Los controllers lo reciben con `@AuthenticationPrincipal AuthUser user`.
- El `id` del usuario autenticado se pasa al servicio; nunca se confía en un identificador enviado por el cliente.
- Las reglas de autorización y propiedad del vehículo se comprueban también en el servicio, no solo en el controller.
- La API es stateless: no se añaden sesiones de servidor.

## Errores

- `ApiException` para errores de negocio con estado HTTP.
- `EmailVerificationRequiredException` para el login bloqueado por correo sin verificar.
- `GlobalExceptionHandler` centraliza `ProblemDetail`.
- Los errores de validación devuelven un mapa `errors` por campo.
- No devuelvas stack traces ni detalles internos en producción.

## Persistencia

- `spring.jpa.open-in-view=false`: carga explícitamente lo que necesites.
- Las entidades no salen del backend; se convierten a DTOs.
- Las consultas deben filtrar por usuario/vehículo para evitar accesos cruzados.
- Los cálculos de consumo, ahorro y mantenimiento viven en servicios, no en controllers.
- Los borrados respetan las relaciones y el aislamiento entre usuarios.

## Flyway

Migraciones actuales:

```text
V1__init_schema.sql
V2__vehicle_photo.sql
```

Reglas:

- Una migración nueva es un archivo nuevo con el siguiente número.
- No modifiques una migración que ya se haya ejecutado en una base existente.
- Usa SQL compatible con PostgreSQL y con H2 en `MODE=PostgreSQL`.
- Añade índices y claves foráneas pensando en las consultas reales.
- Si una migración falla en local, revisa la base y pide permiso antes de recrearla.

## Tests

- `ApiFlowIntegrationTest` levanta la aplicación con H2 en memoria.
- Usa el `RecordingVerificationEmailSender` para no enviar correos reales.
- Cubre el camino feliz, validación, permisos, recurso inexistente y aislamiento entre usuarios.
- Para cambios de contrato, actualiza también los tests del frontend si aplica.
- Antes de entregar:

```bash
cd backend
./mvnw test
```

## OpenAPI

- Los endpoints nuevos deben llevar `@Operation` y, si corresponde, `@Tag`.
- Los DTOs documentan el contrato real.
- Comprueba Swagger en `/swagger-ui.html` si está disponible.
- No expongas endpoints de administración o depuración sin control de acceso.
