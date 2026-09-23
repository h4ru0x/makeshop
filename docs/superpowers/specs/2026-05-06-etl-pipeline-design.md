# ETL Pipeline — Design Spec
**Date:** 2026-05-06  
**Project:** MakeShop — DataIngest  
**Branch:** DataIngest

---

## Objetivo

Implementar un pipeline de extracción de datos (ETL) que extraiga el 100% de los registros de las 3 bases de datos de MakeShop, genere archivos CSV/JSON y los cargue a S3 para su catalogación en AWS Glue y consulta con AWS Athena.

---

## Infraestructura AWS requerida

| Recurso | Nombre | Descripción |
|---------|--------|-------------|
| EC2 | MV ingesta | Máquina virtual separada donde corren los contenedores |
| S3 Bucket | `makeshop-ingest` | Almacena los archivos de ingesta |
| AWS Glue DB | `makeshop_catalog` | Base de datos del catálogo de datos |
| AWS Region | `us-east-1` | Región de todos los recursos |

### Prerequisito de red
La MV ingesta debe tener acceso a los puertos de las bases de datos del servidor de microservicios (`34.228.142.25`):
- PostgreSQL: `5432`
- MySQL: `3307`
- MongoDB: `27017`

Esto requiere configurar los **Security Groups de AWS** para permitir tráfico entrante en esos puertos desde la IP de la MV ingesta.

---

## Estructura de carpetas

```
DataIngest/
├── seed.py                  (script de población — existente)
├── docker-compose.yml       (orquesta los 3 contenedores)
├── .env.example             (plantilla de variables de entorno)
├── ingest-users/
│   ├── Dockerfile
│   ├── main.py              (extrae PostgreSQL → users.csv → S3)
│   └── requirements.txt
├── ingest-shops/
│   ├── Dockerfile
│   ├── main.py              (extrae MySQL → shops.csv + memberships.csv → S3)
│   └── requirements.txt
└── ingest-products/
    ├── Dockerfile
    ├── main.py              (extrae MongoDB → products.json → S3)
    └── requirements.txt
```

---

## Contenedores Docker

### Patrón común de cada contenedor
1. Conectar a la base de datos usando variables de entorno
2. Extraer el 100% de los registros de cada tabla/colección
3. Escribir archivo(s) localmente dentro del contenedor
4. Subir archivo(s) a S3 con `boto3`
5. Imprimir resumen (registros extraídos, archivo subido)
6. Terminar (exit 0 en éxito, exit 1 en fallo)

### `ingest-users` — PostgreSQL → CSV

**Conexión:** `psycopg2` a PostgreSQL:5432  
**Tabla:** `users`  
**Campos extraídos:** `id, name, email, phone_number, role, subscription, shop_id, enabled, email_verified, token_version, created_at, updated_at`  
**Archivo:** `users.csv`  
**Destino S3:** `s3://makeshop-ingest/users/users.csv`

### `ingest-shops` — MySQL → CSV

**Conexión:** `pymysql` a MySQL:3307  
**Tablas:** `shops`, `memberships`  
**Campos shops:** `id, name, owner_id, phone_number`  
**Campos memberships:** `id, user_id, role, shop_id`  
**Archivos:** `shops.csv`, `memberships.csv`  
**Destino S3:** `s3://makeshop-ingest/shops/shops.csv`, `s3://makeshop-ingest/shops/memberships.csv`

### `ingest-products` — MongoDB → JSON

**Conexión:** `pymongo` a MongoDB:27017  
**Colección:** `products`  
**Campos extraídos:** `id, name, price, description, imageUrl, availability, shopId`  
**Archivo:** `products.json` (array de objetos)  
**Destino S3:** `s3://makeshop-ingest/products/products.json`

---

## docker-compose.yml

- 3 servicios independientes: `ingest-users`, `ingest-shops`, `ingest-products`
- Todos leen del mismo archivo `.env`
- Corren en paralelo al ejecutar `docker-compose up`
- `restart: no` — ejecución única, terminan al completar
- Si un contenedor falla, los otros continúan

**Comando de ejecución en la MV ingesta:**
```bash
docker-compose up --build
```

---

## Variables de entorno (`.env`)

```env
# PostgreSQL (user-service)
POSTGRES_HOST=34.228.142.25
POSTGRES_PORT=5432
POSTGRES_DB=userdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

# MySQL (shop-service)
MYSQL_HOST=34.228.142.25
MYSQL_PORT=3307
MYSQL_DB=shopdb
MYSQL_USER=admin
MYSQL_PASSWORD=admin123

# MongoDB (product-service)
MONGO_URI=mongodb://admin:admin123@34.228.142.25:27017/productdb

# AWS
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET=makeshop-ingest
```

---

## S3 — Estructura del bucket

```
s3://makeshop-ingest/
├── users/
│   └── users.csv
├── shops/
│   ├── shops.csv
│   └── memberships.csv
└── products/
    └── products.json
```

---

## AWS Glue — Catálogo de datos

**Base de datos Glue:** `makeshop_catalog`

| Crawler | Prefijo S3 | Tablas generadas |
|---------|-----------|-----------------|
| `crawler-users` | `s3://makeshop-ingest/users/` | `users` |
| `crawler-shops` | `s3://makeshop-ingest/shops/` | `shops`, `memberships` |
| `crawler-products` | `s3://makeshop-ingest/products/` | `products` |

Los crawlers se configuran manualmente en la consola de AWS Glue apuntando a cada prefijo S3. Tras correr los crawlers, el catálogo tendrá 4 tablas.

---

## Diagrama Entidad / Relación

```
┌─────────────────┐         ┌──────────────────┐
│     users       │         │      shops        │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ owner_id (FK)    │
│ name            │         │ id (PK)           │
│ email           │         │ name              │
│ phone_number    │         │ phone_number      │
│ role            │         └────────┬─────────┘
│ subscription    │                  │
│ shop_id (FK)────┼──────────────────┘
│ enabled         │         ┌──────────────────┐
│ email_verified  │         │   memberships    │
│ token_version   │         ├──────────────────┤
│ created_at      │◄────────│ user_id (FK)     │
│ updated_at      │         │ id (PK)           │
└─────────────────┘         │ shop_id (FK)──────┼──► shops.id
                            │ role              │
                            └──────────────────┘

┌─────────────────┐
│    products     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ price           │
│ description     │
│ imageUrl        │
│ availability    │
│ shopId (FK)─────┼──────────────────────────► shops.id
└─────────────────┘
```

**Relaciones:**
- `users.shop_id` → `shops.id` (usuario pertenece a una tienda)
- `shops.owner_id` → `users.id` (tienda tiene un dueño)
- `memberships.user_id` → `users.id`
- `memberships.shop_id` → `shops.id`
- `products.shopId` → `shops.id`

---

## AWS Athena — Queries y Vistas

### Query 1: Productos con nombre de tienda
```sql
SELECT p.id, p.name, p.price, p.availability, s.name AS shop_name
FROM makeshop_catalog.products p
JOIN makeshop_catalog.shops s ON p.shopid = s.id;
```

### Query 2: Usuarios con su tienda asignada
```sql
SELECT u.id, u.name, u.email, u.role, s.name AS shop_name
FROM makeshop_catalog.users u
LEFT JOIN makeshop_catalog.shops s ON u.shop_id = s.id
WHERE u.role = 'USER';
```

### Query 3: Miembros por tienda con su rol
```sql
SELECT s.name AS shop_name, u.name AS user_name, u.email, m.role
FROM makeshop_catalog.memberships m
JOIN makeshop_catalog.shops s ON m.shop_id = s.id
JOIN makeshop_catalog.users u ON m.user_id = u.id
ORDER BY s.name;
```

### Query 4: Resumen de productos y usuarios por tienda
```sql
SELECT 
    s.name AS shop_name,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT u.id) AS total_users
FROM makeshop_catalog.shops s
LEFT JOIN makeshop_catalog.products p ON p.shopid = s.id
LEFT JOIN makeshop_catalog.users u ON u.shop_id = s.id
GROUP BY s.name
ORDER BY total_products DESC;
```

### Vista 1: `v_tienda_resumen`
```sql
CREATE OR REPLACE VIEW makeshop_catalog.v_tienda_resumen AS
SELECT 
    s.id AS shop_id,
    s.name AS shop_name,
    s.phone_number,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT u.id) AS total_users
FROM makeshop_catalog.shops s
LEFT JOIN makeshop_catalog.products p ON p.shopid = s.id
LEFT JOIN makeshop_catalog.users u ON u.shop_id = s.id
GROUP BY s.id, s.name, s.phone_number;
```

### Vista 2: `v_usuarios_tienda`
```sql
CREATE OR REPLACE VIEW makeshop_catalog.v_usuarios_tienda AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    u.role,
    s.name AS shop_name,
    m.role AS membership_role
FROM makeshop_catalog.users u
LEFT JOIN makeshop_catalog.shops s ON u.shop_id = s.id
LEFT JOIN makeshop_catalog.memberships m ON m.user_id = u.id AND m.shop_id = s.id;
```

---

## Manejo de errores

- Si la conexión a la BD falla: el contenedor imprime el error y termina con exit 1
- Si la subida a S3 falla: el contenedor imprime el error y termina con exit 1
- Los demás contenedores no se ven afectados por el fallo de uno

---

## GitHub

El repositorio debe ser público. La carpeta `DataIngest/` contiene todo el código fuente de la ingesta. El enlace al repo se incluye en el README.
