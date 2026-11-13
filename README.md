# carhealth.

**Tu coche, en orden.**

Aplicación web _mobile-first_ y _offline-first_ para llevar el control real de un coche: repostajes, consumo, coste por kilómetro, mantenimiento, recambios, ahorro por gasolinera y libro de mantenimiento en PDF.

No es una hoja de cálculo con otro nombre: calcula lo que de verdad gasta el coche, compara tus repostajes contigo mismo y te deja apuntar un repostaje aunque estés en un parking sin cobertura.

![Dashboard de carhealth](docs/screenshots/02-dashboard-desktop.png)

---

## Índice

- [Qué incluye](#qué-incluye)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Puesta en marcha en local](#puesta-en-marcha-en-local)
- [Cuenta de demostración](#cuenta-de-demostración)
- [Funcionamiento offline](#funcionamiento-offline)
- [Tests](#tests)
- [API REST](#api-rest)
- [Lógica de negocio](#lógica-de-negocio)
- [Capturas](#capturas)
- [Despliegue con Docker](#despliegue-con-docker)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Seguridad y mantenimiento](#seguridad-y-mantenimiento)

---

## Qué incluye

### Garaje
- Alta, edición y eliminación de vehículos.
- Datos técnicos: marca, modelo, año, matrícula, VIN, código de motor, combustible, color, fecha y precio de compra.
- Kilometraje actual y cambio rápido de vehículo activo.
- Plan de mantenimiento preventivo creado automáticamente para cada coche.

### Repostajes
- Registro de fecha, odómetro, litros, precio por litro, importe total, gasolinera y ubicación.
- Cálculo automático del **gasto** y del **consumo real full-to-full**.
- Comparación del precio pagado con la media histórica de esa estación y con el repostaje anterior.
- Ahorro estimado por repostaje y acumulado.
- Historial agrupado por mes, con litros, precio unitario, consumo y ahorro.
- Aviso de depósito parcial: los repostajes parciales no falsean el consumo.

### Mantenimiento
- Intervenciones preventivas, correctivas, mejoras y trámites legales.
- Mano de obra, recambios con referencia OEM, marca, cantidad y precio unitario.
- Vinculación de una intervención al plan preventivo para actualizar su próximo vencimiento.
- Estado del plan: **al día**, **próximo**, **vencido** o **sin datos**, calculado por kilómetros y por tiempo.
- Historial con coste desglosado y notas.
- **Dossier PDF** descargable con los datos del coche y su mantenimiento.

### Análisis
- KPIs del mes y de los últimos 30 días.
- Gasto de combustible y taller en los últimos 12 meses.
- Consumo real, evolución de precios y comparativa de gasolineras.
- Coste por kilómetro, litros repostados y ahorro acumulado.
- Dashboard con próximos mantenimientos y movimientos recientes.

### Experiencia
- Interfaz en español, responsive y pensada primero para el móvil.
- Tema claro y oscuro persistente.
- Instalable como PWA con iconos propios.
- Sin cobertura: los repostajes e intervenciones se guardan en el dispositivo y se sincronizan al volver la conexión.

---

## Stack técnico

| Capa | Tecnología |
| --- | --- |
| Backend | Java 21, Spring Boot 4.1.2, Spring MVC, Spring Data JPA, Spring Security |
| Autenticación | JWT HS256, BCrypt, API _stateless_ |
| Base de datos | PostgreSQL 17 en Docker; H2 en modo PostgreSQL para desarrollo local |
| Migraciones | Flyway (`V1__init_schema.sql`) |
| Documentación | Springdoc OpenAPI 3 + Swagger UI |
| PDF | OpenPDF |
| Frontend | Angular 22, standalone components, Signals, zoneless |
| Estilos | Tailwind CSS 4, diseño propio con Plus Jakarta Sans |
| Estado offline | Angular Service Worker + IndexedDB (`idb`) |
| Tests | JUnit 5 + MockMvc; Vitest mediante el builder de Angular |
| Despliegue | Docker multi-stage, Nginx, Caddy con SSL automático |

---

## Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│                         Navegador                           │
│  Angular 22 · Signals · Tailwind · PWA · IndexedDB          │
│                                                             │
│  GET  ──► caché IndexedDB ◄── service worker (app shell)    │
│  POST ──► cola offline ──► reintento con idempotencia       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS · JWT Bearer
┌───────────────────────────▼─────────────────────────────────┐
│                    Caddy (SSL automático)                    │
│         /api/* · /swagger-ui* · /v3/api-docs*               │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
┌───────────────▼──────────────┐  ┌───────────▼───────────────┐
│  Spring Boot 4               │  │  Nginx + build Angular    │
│  Controller → Service → Repo │  │  SPA + assets + PWA       │
│  JWT · OpenAPI · PDF         │  └───────────────────────────┘
└───────────────┬──────────────┘
                │ JDBC
┌───────────────▼──────────────┐
│  PostgreSQL 17 + Flyway      │
│  Volumen persistente         │
└──────────────────────────────┘
```

El backend es una API sin estado: no guarda sesión en servidor. Cada petición protegida lleva `Authorization: Bearer <token>`, de modo que la misma API puede consumirse desde la web Angular, una futura app Kotlin o cualquier otro cliente.

---

## Puesta en marcha en local

### Requisitos

- **JDK 21** o superior.
- **Node.js 24 LTS** y npm (Angular 22 también funciona con Node 22 reciente).
- No hace falta PostgreSQL para desarrollo: el backend usa H2 en un archivo local.
- Docker y el plugin `docker compose` solo son necesarios para el despliegue.

### 1. Backend

```bash
cd backend
./mvnw spring-boot:run
```

La primera ejecución crea `dbconfig/h2/carhealth.mv.db`, aplica Flyway y siembra los datos de demostración.

- API: <http://localhost:8080/api/v1>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>
- Healthcheck: <http://localhost:8080/actuator/health>
- Consola H2 (solo local): <http://localhost:8080/h2-console>

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm start
```

Abre <http://localhost:4200>. El servidor de desarrollo redirige `/api` al backend en el puerto 8080 mediante `proxy.conf.json`.

### 3. Cuenta de demostración

| Campo | Valor |
| --- | --- |
| Correo | `demo@carhealth.app` |
| Contraseña | `demo1234` |

En desarrollo aparece además el botón **«Explorar con el garaje de Marta»** en la pantalla de acceso, que entra directamente con esta cuenta.

La cuenta demo incluye un Seat León 2021 («El León»), 18 repostajes repartidos por un año, cuatro intervenciones de mantenimiento y su plan preventivo.

### 4. Reiniciar los datos de demo

El seeder solo actúa si el usuario demo no existe. Para dejarlo todo limpio:

```bash
# Detén el backend con Ctrl+C
cd backend
rm -f ../dbconfig/h2/carhealth.*.db
./mvnw spring-boot:run
```

También puedes arrancar sin datos de demo:

```bash
DEMO_DATA=false ./mvnw spring-boot:run
```

### Variables de entorno útiles en local

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PORT` | `8080` | Puerto del backend |
| `DB_URL` | H2 en `../dbconfig/h2/carhealth` (desde `backend/`) | URL JDBC; en Docker apunta a PostgreSQL |
| `DB_USERNAME` | `sa` | Usuario de base de datos |
| `DB_PASSWORD` | vacío | Contraseña de base de datos |
| `JWT_SECRET` | secreto de desarrollo | Firma de los JWT; cámbialo fuera de local |
| `JWT_EXPIRATION_DAYS` | `30` | Duración del token en días |
| `DEMO_DATA` | `true` | Crea la cuenta demo al arrancar |
| `CORS_ORIGINS` | `http://localhost:4200` | Orígenes permitidos, separados por comas |
| `SPRINGDOC_ENABLED` | `true` | Activa Swagger y OpenAPI |
| `H2_CONSOLE` | `true` | Activa la consola H2 |

---

## Funcionamiento offline

La app está diseñada para que perder cobertura no te haga perder un repostaje.

1. **App shell**: el service worker de Angular precarga HTML, CSS, JS, fuentes e iconos. Si ya has abierto la app, puedes recargarla sin conexión.
2. **Lecturas**: el interceptor de `offline-cache` guarda en IndexedDB las respuestas GET por usuario y vehículo. Si la red falla, se sirve la última copia disponible y se muestra el aviso de modo offline.
3. **Escrituras**: si guardas un repostaje o una intervención sin conexión, la petición se guarda en una cola persistente con una vista previa. La UI la muestra como **pendiente**.
4. **Sincronización**: al recuperar la conexión, la cola se reproduce en orden. Cada mutación lleva un `clientMutationId`; el backend lo usa para no crear duplicados si el reintento se cruza con una respuesta perdida.
5. **Aislamiento**: las respuestas y la cola se filtran por usuario, de modo que cerrar sesión o cambiar de cuenta no mezcla datos.

Los elementos pendientes se pueden reintentar o descartar desde la interfaz. Las operaciones que no son de creación (editar o borrar un coche, por ejemplo) requieren conexión.

La estrategia se verificó con una build de producción y Playwright: recarga offline con service worker, alta de repostaje sin red, sincronización automática al volver online y creación de un único registro en el servidor.

---

## Tests

### Backend

```bash
cd backend
./mvnw test
```

El test de integración `ApiFlowIntegrationTest` levanta la aplicación con H2 en memoria y cubre, entre otras cosas:

- registro, login con JWT y rechazo de credenciales incorrectas;
- creación de vehículo y generación automática de su plan preventivo;
- alta de repostajes, consumo full-to-full y resumen de ahorro;
- idempotencia de mutaciones offline y aislamiento de datos entre usuarios;
- intervenciones con recambios y actualización del odómetro;
- dashboard, estadísticas y dossier PDF;
- validación de peticiones, borrado de vehículos y correo duplicado.

### Frontend

```bash
cd frontend
npm test
```

Incluye tests de las utilidades de formato (euros, kilómetros, fechas, etiquetas y estados) con Vitest.

### Build de producción

```bash
cd frontend
npm run build
```

El resultado queda en `frontend/dist/frontend/browser`, que es exactamente lo que copia la imagen de Nginx.

---

## API REST

Todas las rutas, salvo registro, login y healthcheck, requieren la cabecera:

```http
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Crea una cuenta y devuelve JWT + usuario |
| `POST` | `/api/v1/auth/login` | Inicia sesión y devuelve JWT + usuario |
| `GET` | `/api/v1/auth/me` | Perfil del usuario autenticado |
| `PATCH` | `/api/v1/auth/me` | Actualiza el nombre visible |
| `POST` | `/api/v1/auth/change-password` | Cambia la contraseña |

### Vehículos y análisis

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/vehicles` | Garaje del usuario |
| `POST` | `/api/v1/vehicles` | Añade un vehículo |
| `GET` | `/api/v1/vehicles/{id}` | Detalle del vehículo |
| `PUT` | `/api/v1/vehicles/{id}` | Actualiza el vehículo |
| `DELETE` | `/api/v1/vehicles/{id}` | Elimina el vehículo y sus datos |
| `GET` | `/api/v1/vehicles/{id}/dashboard` | KPIs, próximos mantenimientos y actividad |
| `GET` | `/api/v1/vehicles/{id}/stats` | Series mensuales, consumo, precios y estaciones |
| `GET` | `/api/v1/vehicles/{id}/dossier.pdf` | Libro de mantenimiento en PDF |

### Repostajes

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/vehicles/{id}/fuel-logs` | Historial de repostajes |
| `POST` | `/api/v1/vehicles/{id}/fuel-logs` | Registra un repostaje y calcula consumo/ahorro |
| `GET` | `/api/v1/vehicles/{id}/fuel-logs/stats` | Totales y series para gráficas |

Ejemplo de alta:

```json
{
  "date": "2026-11-12T18:15:00",
  "odometer": 48320,
  "liters": 39.9,
  "pricePerLiter": 1.515,
  "totalCost": 60.45,
  "stationName": "Ballenoil",
  "stationLocation": "Ballenoil · Leganés",
  "fullTank": true,
  "boardComputerAvg": 6.1,
  "clientMutationId": "7f6f20d4-7d3d-4a6e-9d0f-2f6b6a5c1e21"
}
```

La respuesta incluye `consumption` y un objeto `savings` con el precio de referencia, el ahorro unitario, el ahorro total y un mensaje listo para mostrar.

### Mantenimiento

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/vehicles/{id}/maintenance-rules` | Plan preventivo con estado y próximos vencimientos |
| `POST` | `/api/v1/vehicles/{id}/maintenance-rules` | Añade una regla al plan |
| `DELETE` | `/api/v1/vehicles/{id}/maintenance-rules/{ruleId}` | Elimina una regla |
| `GET` | `/api/v1/vehicles/{id}/service-records` | Historial de intervenciones |
| `POST` | `/api/v1/vehicles/{id}/service-records` | Registra intervención, mano de obra y recambios |

Los errores se devuelven como `ProblemDetail` (`application/problem+json`) con `status`, `title` y `detail`, y errores de validación en `errors`.

La documentación interactiva completa está en **Swagger UI**: `/swagger-ui.html`.

---

## Lógica de negocio

### Ahorro por gasolinera

Al registrar un repostaje se elige un precio de referencia:

1. Si hay repostajes previos en la **misma estación**, se usa su media ponderada por litros.
2. Si no hay historial de esa estación, se usa el **repostaje anterior** del vehículo.
3. Si es el primero, no hay comparación todavía.

```text
ahorro unitario = precio de referencia − precio actual
ahorro total    = ahorro unitario × litros actuales
% más barato    = ahorro unitario / precio de referencia × 100
```

El resultado se devuelve en `savings` y se muestra en la UI como «Has echado un 4,2 % más barato que la media de esta gasolinera».

### Consumo real full-to-full

Solo se calcula entre depósitos completos:

```text
consumo = litros repostados desde el último depósito completo
          ────────────────────────────────────────────────────
          diferencia de odómetro entre ambos depósitos completos
```

Los repostajes parciales intermedios suman litros, pero no se usan como punto de corte. Así el consumo no se dispara artificialmente al llenar medio depósito.

### Mantenimiento preventivo

Cada regla define un intervalo en kilómetros, en meses o ambos. El backend calcula el próximo vencimiento a partir de la última intervención vinculada (o de la línea base del vehículo) y devuelve:

- `remainingKm` y `remainingDays`;
- estado `OVERDUE`, `DUE_SOON`, `OK` o `UNKNOWN`;
- próxima fecha y próximo kilómetro.

La UI muestra los vencidos y próximos en el dashboard y en la pantalla de mantenimiento.

### Idempotencia offline

`FuelLogRequest` y `ServiceRecordRequest` aceptan `clientMutationId`. Antes de insertar, el servicio busca ese identificador; si ya existe, devuelve el registro existente en lugar de duplicarlo. Es la pieza que hace segura la reproducción de la cola offline.

---

## Capturas

### Escritorio

| Dashboard | Repostajes |
| --- | --- |
| ![Dashboard](docs/screenshots/02-dashboard-desktop.png) | ![Repostajes](docs/screenshots/03-fuel-desktop.png) |

| Estadísticas | Mantenimiento |
| --- | --- |
| ![Estadísticas](docs/screenshots/07-stats-desktop.png) | ![Mantenimiento](docs/screenshots/05-services-desktop.png) |

| Nuevo repostaje | Mi garaje |
| --- | --- |
| ![Nuevo repostaje](docs/screenshots/04-fuel-form-desktop.png) | ![Mi garaje](docs/screenshots/08-garage-desktop.png) |

### Móvil

| Dashboard | Repostajes | Estadísticas |
| --- | --- | --- |
| ![Dashboard móvil](docs/screenshots/09-dashboard-mobile.png) | ![Repostajes móvil](docs/screenshots/10-fuel-mobile.png) | ![Estadísticas móvil](docs/screenshots/12-stats-mobile.png) |

---

## Despliegue con Docker

El repositorio incluye una stack completa: PostgreSQL, backend, frontend y Caddy como proxy inverso con HTTPS automático.

### 1. Preparar el entorno

```bash
cp .env.example .env
openssl rand -base64 48   # úsalo como POSTGRES_PASSWORD
openssl rand -base64 48   # úsalo como JWT_SECRET
```

Edita `.env`:

```dotenv
POSTGRES_DB=carhealth
POSTGRES_USER=carhealth
POSTGRES_PASSWORD=<secreto-largo>
JWT_SECRET=<secreto-de-al-menos-32-bytes>
JWT_EXPIRATION_DAYS=30

# Producción con dominio y HTTPS automático:
SITE_ADDRESS=carhealth.tudominio.com

# En local/pruebas por HTTP:
# SITE_ADDRESS=http://localhost

DEMO_DATA=false
# Ponlo a false si no quieres Swagger público:
SPRINGDOC_ENABLED=true
CORS_ORIGINS=http://localhost
```

> `DEMO_DATA=false` evita crear la cuenta demo en producción. Si quieres enseñar la app con datos de ejemplo, cámbialo a `true` solo en un entorno controlado.

### 2. Levantar la stack

```bash
docker compose up -d --build
```

Servicios:

| Servicio | Función | Puerto |
| --- | --- | --- |
| `caddy` | Entrada HTTP/HTTPS, proxy y certificados | `80`, `443` |
| `frontend` | Nginx con el build de Angular | interno `80` |
| `backend` | API Spring Boot | interno `8080` |
| `postgres` | PostgreSQL 17 con volumen persistente | interno `5432` |

Comprobaciones:

```bash
docker compose ps
docker compose logs -f caddy
curl -fsS https://carhealth.tudominio.com/actuator/health
```

Caddy enruta `/api/*`, `/swagger-ui*` y `/v3/api-docs*` al backend, y el resto al frontend. En el primer arranque, Flyway crea el esquema en PostgreSQL.

### 3. Actualizar una instancia

```bash
git pull
docker compose up -d --build
```

Los volúmenes `postgres_data`, `caddy_data` y `caddy_config` se conservan.

### 4. Copias de seguridad

```bash
docker compose exec -T postgres pg_dump -U carhealth carhealth \
  > carhealth-$(date +%F).sql
```

Guarda también el volumen de Caddy si quieres conservar los certificados, aunque Caddy puede volver a emitirlos.

### Desarrollo con PostgreSQL (opcional)

El backend acepta cualquier PostgreSQL mediante variables:

```bash
DB_URL=jdbc:postgresql://localhost:5432/carhealth \
DB_USERNAME=carhealth \
DB_PASSWORD=carhealth \
./mvnw spring-boot:run
```

---

## Estructura del proyecto

```text
.
├── backend/
│   ├── src/main/java/com/carhealth/api/
│   │   ├── config/          # Seguridad, OpenAPI y datos demo
│   │   ├── controller/      # Endpoints REST
│   │   ├── domain/          # Entidades JPA
│   │   ├── dto/             # Requests y responses
│   │   ├── error/           # ProblemDetail y excepciones
│   │   ├── repository/      # Spring Data JPA
│   │   ├── security/        # JWT y filtro Bearer
│   │   └── service/         # Lógica de negocio, estadísticas y PDF
│   ├── src/main/resources/
│   │   └── db/migration/    # Flyway
│   ├── src/test/            # Integración con H2
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/app/
│   │   ├── core/            # Auth, modelos, stores, caché y cola offline
│   │   ├── features/        # Auth, dashboard, fuel, maintenance, stats, garage
│   │   ├── layout/          # Shell con sidebar, bottom nav y FAB
│   │   └── shared/          # Iconos, gráficas, modales y componentes UI
│   ├── public/              # Iconos PWA y fuentes
│   ├── ngsw-config.json
│   ├── Dockerfile
│   └── nginx.conf
├── dbconfig/
│   ├── h2/                  # Datos H2 locales (ignorados por Git)
│   └── README.md            # Operación de la base de datos
├── docs/screenshots/
├── docker-compose.yml
├── Caddyfile
├── .env.example
└── AGENTS.md                # Especificación funcional original
```

---

## Seguridad y mantenimiento

- **JWT**: el token se firma con `JWT_SECRET`; usa un valor aleatorio largo y distinto por entorno. La API es stateless y no expone sesiones de servidor.
- **Contraseñas**: se almacenan con BCrypt; nunca se devuelven en las respuestas.
- **Aislamiento**: cada consulta comprueba la propiedad del vehículo. Un usuario no puede leer ni modificar datos de otro.
- **Validación**: los DTO usan Jakarta Validation y los errores se normalizan a `ProblemDetail`.
- **H2**: la consola está pensada solo para desarrollo y se desactiva con `H2_CONSOLE=false` en Docker.
- **Swagger**: se puede desactivar en producción con `SPRINGDOC_ENABLED=false`; si lo dejas activo, recuerda que las rutas de documentación son públicas.
- **Secretos**: `.env` está ignorado por Git. No subas nunca la contraseña de PostgreSQL ni el secreto JWT.
- **HTTPS**: Caddy obtiene y renueva los certificados automáticamente si `SITE_ADDRESS` es un dominio real con DNS apuntando al servidor.
- **Actualizaciones**: el service worker sirve la app desde caché; Nginx fuerza `no-cache` para `ngsw-worker.js` e `index.html` para que las versiones nuevas lleguen en la siguiente carga.

---

<p align="center">
  <strong>carhealth.</strong> · Tu garaje, en orden.<br />
  Hecho para quien cuida lo que conduce.
</p>
