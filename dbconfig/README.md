# dbconfig

Carpeta reservada para los datos y la configuración local de la base de datos.

## Contenido

```text
dbconfig/
├── h2/                        # Datos locales de H2 (no se suben a Git)
│   ├── .gitkeep
│   └── carhealth.mv.db
└── README.md
```

## Base de datos local

El backend usa H2 en modo PostgreSQL para desarrollo. El archivo de datos vive en:

```text
dbconfig/h2/carhealth.mv.db
```

La ruta configurada en `backend/src/main/resources/application.yml` es relativa al directorio desde el que se arranca el backend:

```text
jdbc:h2:file:../dbconfig/h2/carhealth
```

Maven (`./mvnw spring-boot:run`) y VS Code arrancan el backend con `backend/` como directorio de trabajo, por lo que `../dbconfig/h2` apunta aquí.

Si arrancas el JAR desde otra carpeta, sobrescribe la ruta:

```bash
DB_URL='jdbc:h2:file:/ruta/absoluta/dbconfig/h2/carhealth;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH' \
  java -jar backend/target/carhealth-api-0.0.1-SNAPSHOT.jar
```

## Reiniciar los datos de demo

Detén el backend y elimina el archivo H2. En el siguiente arranque, Flyway crea el esquema y el seeder vuelve a generar los datos de demostración:

```bash
cd backend
rm -f ../dbconfig/h2/carhealth.*.db
./mvnw spring-boot:run
```

Haz una copia si quieres conservar los datos actuales:

```bash
cp dbconfig/h2/carhealth.mv.db dbconfig/h2/carhealth.backup.mv.db
```

## Migraciones Flyway

Los scripts de migración se mantienen en:

```text
backend/src/main/resources/db/migration/
```

No se mueven a `dbconfig/` porque forman parte del artefacto del backend: Flyway las lee del classpath, viajan dentro del JAR y se aplican automáticamente tanto en H2 como en PostgreSQL. Así el despliegue con Docker no necesita ningún paso adicional.

## Producción (PostgreSQL)

En Docker no se usa H2. El `docker-compose.yml` levanta un contenedor PostgreSQL independiente y guarda sus datos en el volumen `postgres_data`, no en esta carpeta. El backend recibe la conexión mediante:

```env
DB_URL=jdbc:postgresql://postgres:5432/carhealth
DB_USERNAME=carhealth
DB_PASSWORD=...
```

El volumen sobrevive a `docker compose down`; solo se elimina con `docker compose down -v`. Para hacer copias de seguridad:

```bash
docker compose exec -T postgres pg_dump -U carhealth carhealth \
  > carhealth-$(date +%F).sql
```
