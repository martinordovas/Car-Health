# AGENTS.md - Car Log & Telemetry System (Spring Boot + Angular + Kotlin Mobile Ready)

Este documento define la arquitectura, el diseño de la API REST (bajo especificación OpenAPI), el modelo de datos y las reglas de negocio para el desarrollo del sistema de telemetría y costes de vehículos.

---

## 1. Arquitectura y Principios de Diseño
- **Backend:** Spring Boot (Java 17+), estructurado en capas (Controller -> Service -> Repository), exponiendo una API REST desacoplada y sin estado (*stateless*).
- **Seguridad y Clientes:** Autenticación basada en **JWT (JSON Web Tokens)**. Esto garantiza que tanto la SPA de Angular como una futura app móvil en Kotlin (Jetpack Compose Multiplatform) consuman la misma API de forma idéntica usando cabeceras `Authorization: Bearer <token>`.
- **Documentación de API:** Obligatorio uso de **Springdoc OpenAPI (Swagger)** para que la API sea auto-documentada y consumible de forma tipada por otros clientes.
- **Frontend Web:** Angular (última versión, standalone components, Signals).
- **Infraestructura:** Docker y Docker Compose, desplegado sobre un VPS con Debian, con proxy inverso (Nginx/Caddy) y certificados SSL automáticos.

---

## 2. Modelo de Datos Relacional (PostgreSQL + Flyway)

La base de datos se versionará estrictamente mediante scripts de Flyway (`V1__init_schema.sql`, etc.).

### Entidades Principales:
1. **`users`**
   - `id` (UUID o Long)
   - `email`, `password_hash`, `created_at`

2. **`vehicles`**
   - `id`, `user_id` (FK)
   - `brand`, `model`, `year`, `engine_code`, `vin`, `license_plate`
   - `current_odometer` (INT)
   - `purchase_date`, `purchase_price` (DECIMAL)

3. **`fuel_logs`** *(Repostajes con lógica de ahorro y estaciones)*
   - `id`, `vehicle_id` (FK)
   - `date` (TIMESTAMP)
   - `odometer` (INT)
   - `liters` (DECIMAL)
   - `price_per_liter` (DECIMAL) - *Precio unitario pagado*
   - `total_cost` (DECIMAL)
   - `station_name` (VARCHAR) - *Nombre o marca de la gasolinera (ej: Plenoil, Cepsa, Carrefour)*
   - `station_location` (VARCHAR) - *Ubicación o identificador único para agrupar*
   - `is_full_tank` (BOOLEAN) - *Clave para el cálculo real de consumos*
   - `board_computer_avg` (DECIMAL, nullable) - *Consumo medio que marca el cuadro del coche*

4. **`maintenance_rules`** *(Planes preventivos teóricos)*
   - `id`, `vehicle_id` (FK)
   - `name` (VARCHAR) - *Ej: "Aceite y filtro 5W30"*
   - `interval_km` (INT, nullable)
   - `interval_months` (INT, nullable)

5. **`service_records`** *(Intervenciones reales realizadas)*
   - `id`, `vehicle_id` (FK), `rule_id` (FK, nullable)
   - `date`, `odometer`, `category` (ENUM: `PREVENTIVE`, `CORRECTIVE`, `MODIFICATION`, `LEGAL`)
   - `total_cost`, `labor_cost`, `performed_by` (`DIY` o `WORKSHOP`), `notes`, `invoice_file_path`

6. **`part_items`** *(Desglose de recambios)*
   - `id`, `service_record_id` (FK)
   - `part_name`, `oem_reference`, `brand`, `quantity`, `unit_price`

---

## 3. Lógica de Negocio Clave (Backend)

### A. Motor de Comparación y Ahorro por Gasolinera
Cuando el usuario registra un nuevo `FuelLog`:
1. El servicio busca el repostaje anterior registrado para ese mismo vehículo.
2. Compara el `station_location` actual con el del repostaje anterior (o con la media histórica de esa misma estación).
3. **Cálculo de Ahorro:** 
   * Si `price_per_liter` actual es menor que el precio medio histórico registrado para esa estación (o que el repostaje anterior en el mismo sitio), se calcula la diferencia:
     $$\text{Ahorro Unitario} = \text{Precio Referencia} - \text{Precio Actual}$$
     $$\text{Ahorro Total Repostaje} = \text{Ahorro Unitario} \times \text{Litros Actuales}$$
4. El backend devuelve en el JSON de respuesta un objeto `savingsSummary` (ej: *"¡Has echado un 4.2% más barato que la media de esta gasolinera! Te has ahorrado 2.15€ en este depósito"*).

### B. Cálculo de Consumo Real (*Full-to-Full*)
- Solo se calcula cuando `is_full_tank == true`.
- Busca el repostaje previo que también fuera `is_full_tank == true`.
- Suma todos los litros de los repostajes intermedios (si los hubo) y divide entre la diferencia de kilómetros reales.

---

## 4. Endpoints REST Esenciales (Diseño OpenAPI)

- `POST /api/v1/auth/login` -> Autenticación, devuelve JWT.
- `GET /api/v1/vehicles` -> Lista los vehículos del usuario.
- `GET /api/v1/vehicles/{id}/dashboard` -> KPIs, estado de mantenimientos y consumo medio actual.
- `POST /api/v1/vehicles/{id}/fuel-logs` -> Registra repostaje y calcula al vuelo el ahorro comparativo.
- `GET /api/v1/vehicles/{id}/fuel-logs/stats` -> Histórico para pintar gráficas en Angular/Kotlin.
- `POST /api/v1/vehicles/{id}/service-records` -> Registra mantenimiento con sus piezas y factura.
- `GET /api/v1/vehicles/{id}/dossier.pdf` -> Descarga del libro de mantenimiento en PDF.

---

## 5. Especificaciones de Despliegue (Docker & VPS Debian)
- Imagen multi-etapa con Temurin Java 17/21 para el backend.
- Contenedor Nginx estático para el build de Angular.
- Contenedor PostgreSQL oficial con volumen persistente cifrado.
- Proxy inverso central (Caddy o Nginx) manejando terminación SSL y enrutando `/api/` al backend y `/` al frontend.