# ETL Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 3 contenedores Docker Python que extraen el 100% de registros de PostgreSQL, MySQL y MongoDB, generan CSV/JSON y los suben a S3, orquestados con docker-compose.

**Architecture:** Cada contenedor tiene una sola responsabilidad: conectar a su BD, extraer, escribir archivo y subir a S3. Los 3 corren en paralelo via docker-compose usando un solo `.env`. Las funciones internas son testeables con mocks sin necesitar conexiones reales.

**Tech Stack:** Python 3.11, psycopg2-binary, pymysql, pymongo, boto3, pytest, Docker, docker-compose

---

## Prerequisitos AWS (consola — no código)

Antes de correr los contenedores, crear manualmente en la consola de AWS:

1. **EC2 "MV ingesta"** — Amazon Linux 2023, instalar Docker y docker-compose
2. **S3 bucket** — nombre: `makeshop-ingest`, región: `us-east-1`
3. **Security Groups** — abrir puertos 5432, 3307, 27017 en el SG del servidor de microservicios hacia la IP de la MV ingesta
4. **IAM** — crear usuario IAM con política `AmazonS3FullAccess`, generar Access Key para el `.env`
5. **AWS Glue** — tras correr los contenedores, crear database `makeshop_catalog` y 3 crawlers:
   - `crawler-users` → `s3://makeshop-ingest/users/`
   - `crawler-shops` → `s3://makeshop-ingest/shops/`
   - `crawler-products` → `s3://makeshop-ingest/products/`

---

## File Map

| Archivo | Responsabilidad |
|---------|-----------------|
| `DataIngest/docker-compose.yml` | Orquesta los 3 servicios con el mismo .env |
| `DataIngest/.env.example` | Plantilla actualizada con vars de BD + AWS |
| `DataIngest/ingest-users/Dockerfile` | Imagen Python para extracción de PostgreSQL |
| `DataIngest/ingest-users/requirements.txt` | psycopg2-binary, boto3, pytest |
| `DataIngest/ingest-users/main.py` | get_connection, extract_users, write_csv, upload_to_s3, main |
| `DataIngest/ingest-users/tests/test_main.py` | Tests con mocks de psycopg2 y boto3 |
| `DataIngest/ingest-shops/Dockerfile` | Imagen Python para extracción de MySQL |
| `DataIngest/ingest-shops/requirements.txt` | pymysql, boto3, pytest |
| `DataIngest/ingest-shops/main.py` | get_connection, extract_shops, extract_memberships, write_csv, upload_to_s3, main |
| `DataIngest/ingest-shops/tests/test_main.py` | Tests con mocks de pymysql y boto3 |
| `DataIngest/ingest-products/Dockerfile` | Imagen Python para extracción de MongoDB |
| `DataIngest/ingest-products/requirements.txt` | pymongo, boto3, pytest |
| `DataIngest/ingest-products/main.py` | get_collection, extract_products, write_json, upload_to_s3, main |
| `DataIngest/ingest-products/tests/test_main.py` | Tests con mocks de pymongo y boto3 |

---

## Task 1: Scaffold — docker-compose, .env.example, Dockerfiles y requirements

**Files:**
- Create: `DataIngest/docker-compose.yml`
- Modify: `DataIngest/.env.example`
- Create: `DataIngest/ingest-users/Dockerfile`
- Create: `DataIngest/ingest-users/requirements.txt`
- Create: `DataIngest/ingest-shops/Dockerfile`
- Create: `DataIngest/ingest-shops/requirements.txt`
- Create: `DataIngest/ingest-products/Dockerfile`
- Create: `DataIngest/ingest-products/requirements.txt`

- [ ] **Step 1: Crear `DataIngest/docker-compose.yml`**

```yaml
version: "3.8"

services:
  ingest-users:
    build: ./ingest-users
    env_file: .env
    restart: "no"

  ingest-shops:
    build: ./ingest-shops
    env_file: .env
    restart: "no"

  ingest-products:
    build: ./ingest-products
    env_file: .env
    restart: "no"
```

- [ ] **Step 2: Reemplazar `DataIngest/.env.example` con este contenido completo**

```env
# ============================================================
# MAKESHOP — DataIngest ENV
# ============================================================

# --- PostgreSQL (user-service) ---
POSTGRES_HOST=34.228.142.25
POSTGRES_PORT=5432
POSTGRES_DB=userdb
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123

# --- MySQL (shop-service) ---
MYSQL_HOST=34.228.142.25
MYSQL_PORT=3307
MYSQL_DB=shopdb
MYSQL_USER=admin
MYSQL_PASSWORD=admin123

# --- MongoDB (product-service) ---
MONGO_URI=mongodb://admin:admin123@34.228.142.25:27017/productdb
MONGO_DB=productdb

# --- AWS ---
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET=makeshop-ingest

# --- Seeder (script de población existente) ---
STORE_SERVICE_URL=http://34.228.142.25:8004
NUM_SHOPS=10
PRODUCTS_PER_SHOP=200
USERS_PER_SHOP=100
CONCURRENCY=20
```

- [ ] **Step 3: Crear `DataIngest/ingest-users/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

- [ ] **Step 4: Crear `DataIngest/ingest-users/requirements.txt`**

```
psycopg2-binary==2.9.9
boto3==1.34.69
pytest==8.2.0
```

- [ ] **Step 5: Crear `DataIngest/ingest-shops/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

- [ ] **Step 6: Crear `DataIngest/ingest-shops/requirements.txt`**

```
pymysql==1.1.1
boto3==1.34.69
pytest==8.2.0
```

- [ ] **Step 7: Crear `DataIngest/ingest-products/Dockerfile`**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

- [ ] **Step 8: Crear `DataIngest/ingest-products/requirements.txt`**

```
pymongo==4.7.2
boto3==1.34.69
pytest==8.2.0
```

- [ ] **Step 9: Commit**

```bash
git add DataIngest/docker-compose.yml DataIngest/.env.example \
  DataIngest/ingest-users/Dockerfile DataIngest/ingest-users/requirements.txt \
  DataIngest/ingest-shops/Dockerfile DataIngest/ingest-shops/requirements.txt \
  DataIngest/ingest-products/Dockerfile DataIngest/ingest-products/requirements.txt
git commit -m "feat(etl): scaffold docker-compose, Dockerfiles and requirements"
```

---

## Task 2: ingest-users — PostgreSQL → users.csv → S3

**Files:**
- Create: `DataIngest/ingest-users/main.py`
- Create: `DataIngest/ingest-users/tests/__init__.py`
- Create: `DataIngest/ingest-users/tests/test_main.py`

- [ ] **Step 1: Crear `DataIngest/ingest-users/tests/__init__.py`**

Archivo vacío.

- [ ] **Step 2: Crear `DataIngest/ingest-users/tests/test_main.py`**

```python
import csv
import os
import sys
import pytest
from unittest.mock import MagicMock, patch, mock_open

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# --- extract_users ---

def test_extract_users_returns_list_of_dicts():
    from main import extract_users

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": "uid-1", "name": "Carlos", "email": "c@b.com",
         "phone_number": "123", "role": "OWNER", "subscription": "FREE",
         "shop_id": None, "enabled": True, "email_verified": True,
         "token_version": 0, "created_at": None, "updated_at": None}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_users(mock_conn)

    assert len(result) == 1
    assert result[0]["name"] == "Carlos"
    assert result[0]["email"] == "c@b.com"


def test_extract_users_calls_correct_query():
    from main import extract_users

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_users(mock_conn)

    call_args = mock_cursor.execute.call_args[0][0]
    assert "FROM users" in call_args
    assert "SELECT" in call_args


# --- write_csv ---

def test_write_csv_creates_file_with_header(tmp_path):
    from main import write_csv

    records = [
        {"id": "1", "name": "Carlos", "email": "c@b.com"}
    ]
    filepath = str(tmp_path / "test.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    assert len(rows) == 1
    assert rows[0]["name"] == "Carlos"
    assert rows[0]["email"] == "c@b.com"


def test_write_csv_raises_on_empty_records(tmp_path):
    from main import write_csv

    with pytest.raises(ValueError, match="No records"):
        write_csv([], str(tmp_path / "empty.csv"))


def test_write_csv_multiple_rows(tmp_path):
    from main import write_csv

    records = [
        {"id": "1", "name": "Ana"},
        {"id": "2", "name": "Luis"},
    ]
    filepath = str(tmp_path / "multi.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 2
    assert rows[1]["name"] == "Luis"


# --- upload_to_s3 ---

def test_upload_to_s3_calls_boto3(tmp_path):
    from main import upload_to_s3

    filepath = str(tmp_path / "users.csv")
    with open(filepath, "w") as f:
        f.write("id,name\n1,Carlos\n")

    with patch("main.boto3") as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3
        upload_to_s3(filepath, "my-bucket", "users/users.csv")

    mock_boto3.client.assert_called_once_with("s3")
    mock_s3.upload_file.assert_called_once_with(filepath, "my-bucket", "users/users.csv")
```

- [ ] **Step 3: Instalar dependencias y verificar que los tests fallan**

```bash
cd DataIngest/ingest-users
pip install -r requirements.txt -q
python -m pytest tests/test_main.py -v 2>&1 | head -20
```

Salida esperada: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 4: Crear `DataIngest/ingest-users/main.py`**

```python
import csv
import os
import sys
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor


def get_connection():
    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
    )


def extract_users(conn) -> list:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, email, phone_number, role, subscription,
                   shop_id, enabled, email_verified, token_version,
                   created_at, updated_at
            FROM users
            """
        )
        return [dict(row) for row in cur.fetchall()]


def write_csv(records: list, filepath: str) -> None:
    if not records:
        raise ValueError("No records to write")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)


def upload_to_s3(filepath: str, bucket: str, key: str) -> None:
    s3 = boto3.client("s3")
    s3.upload_file(filepath, bucket, key)


def main():
    print("=== ingest-users: iniciando ===")

    print("Conectando a PostgreSQL...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"ERROR: No se pudo conectar a PostgreSQL: {e}")
        sys.exit(1)

    print("Extrayendo usuarios...")
    try:
        records = extract_users(conn)
        conn.close()
    except Exception as e:
        print(f"ERROR: Fallo al extraer usuarios: {e}")
        sys.exit(1)

    print(f"  {len(records)} registros extraídos")

    filepath = "/tmp/users.csv"
    print(f"Escribiendo {filepath}...")
    try:
        write_csv(records, filepath)
    except Exception as e:
        print(f"ERROR: Fallo al escribir CSV: {e}")
        sys.exit(1)

    bucket = os.environ["S3_BUCKET"]
    key = "users/users.csv"
    print(f"Subiendo a s3://{bucket}/{key}...")
    try:
        upload_to_s3(filepath, bucket, key)
    except Exception as e:
        print(f"ERROR: Fallo al subir a S3: {e}")
        sys.exit(1)

    print(f"✓ users.csv subido con {len(records)} registros")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Correr tests — todos deben pasar**

```bash
cd DataIngest/ingest-users
python -m pytest tests/test_main.py -v
```

Salida esperada: 6 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add DataIngest/ingest-users/
git commit -m "feat(etl): ingest-users container PostgreSQL to CSV with tests"
```

---

## Task 3: ingest-shops — MySQL → shops.csv + memberships.csv → S3

**Files:**
- Create: `DataIngest/ingest-shops/main.py`
- Create: `DataIngest/ingest-shops/tests/__init__.py`
- Create: `DataIngest/ingest-shops/tests/test_main.py`

- [ ] **Step 1: Crear `DataIngest/ingest-shops/tests/__init__.py`**

Archivo vacío.

- [ ] **Step 2: Crear `DataIngest/ingest-shops/tests/test_main.py`**

```python
import csv
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# --- extract_shops ---

def test_extract_shops_returns_list():
    from main import extract_shops

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": "shop-1", "name": "Tienda A", "owner_id": "uid-1", "phone_number": "123"}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_shops(mock_conn)

    assert len(result) == 1
    assert result[0]["name"] == "Tienda A"


def test_extract_shops_queries_shop_table():
    from main import extract_shops

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_shops(mock_conn)

    query = mock_cursor.execute.call_args[0][0]
    assert "Shop" in query


# --- extract_memberships ---

def test_extract_memberships_returns_list():
    from main import extract_memberships

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = [
        {"id": 1, "user_id": "uid-1", "role": "ADMIN", "shop_id": "shop-1"}
    ]
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    result = extract_memberships(mock_conn)

    assert len(result) == 1
    assert result[0]["role"] == "ADMIN"


def test_extract_memberships_queries_membership_table():
    from main import extract_memberships

    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor

    extract_memberships(mock_conn)

    query = mock_cursor.execute.call_args[0][0]
    assert "Membership" in query


# --- write_csv ---

def test_write_csv_shops(tmp_path):
    from main import write_csv

    records = [{"id": "s1", "name": "Tienda A", "owner_id": "u1", "phone_number": "123"}]
    filepath = str(tmp_path / "shops.csv")
    write_csv(records, filepath)

    with open(filepath, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    assert len(rows) == 1
    assert rows[0]["name"] == "Tienda A"


def test_write_csv_raises_on_empty(tmp_path):
    from main import write_csv

    with pytest.raises(ValueError, match="No records"):
        write_csv([], str(tmp_path / "empty.csv"))


# --- upload_to_s3 ---

def test_upload_to_s3_calls_boto3(tmp_path):
    from main import upload_to_s3

    filepath = str(tmp_path / "shops.csv")
    with open(filepath, "w") as f:
        f.write("id,name\n")

    with patch("main.boto3") as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3
        upload_to_s3(filepath, "my-bucket", "shops/shops.csv")

    mock_s3.upload_file.assert_called_once_with(filepath, "my-bucket", "shops/shops.csv")
```

- [ ] **Step 3: Verificar que los tests fallan**

```bash
cd DataIngest/ingest-shops
pip install -r requirements.txt -q
python -m pytest tests/test_main.py -v 2>&1 | head -10
```

Salida esperada: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 4: Crear `DataIngest/ingest-shops/main.py`**

```python
import csv
import os
import sys
import boto3
import pymysql
import pymysql.cursors


def get_connection():
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        port=int(os.environ.get("MYSQL_PORT", "3307")),
        db=os.environ["MYSQL_DB"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        cursorclass=pymysql.cursors.DictCursor,
    )


def extract_shops(conn) -> list:
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, owner_id, phone_number FROM Shop")
        return cur.fetchall()


def extract_memberships(conn) -> list:
    with conn.cursor() as cur:
        cur.execute("SELECT id, user_id, role, shop_id FROM Membership")
        return cur.fetchall()


def write_csv(records: list, filepath: str) -> None:
    if not records:
        raise ValueError("No records to write")
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=records[0].keys())
        writer.writeheader()
        writer.writerows(records)


def upload_to_s3(filepath: str, bucket: str, key: str) -> None:
    s3 = boto3.client("s3")
    s3.upload_file(filepath, bucket, key)


def main():
    print("=== ingest-shops: iniciando ===")

    print("Conectando a MySQL...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"ERROR: No se pudo conectar a MySQL: {e}")
        sys.exit(1)

    bucket = os.environ["S3_BUCKET"]

    print("Extrayendo tiendas...")
    try:
        shops = extract_shops(conn)
    except Exception as e:
        print(f"ERROR: Fallo al extraer shops: {e}")
        conn.close()
        sys.exit(1)

    print("Extrayendo membresías...")
    try:
        memberships = extract_memberships(conn)
        conn.close()
    except Exception as e:
        print(f"ERROR: Fallo al extraer memberships: {e}")
        conn.close()
        sys.exit(1)

    print(f"  {len(shops)} tiendas, {len(memberships)} membresías extraídas")

    for records, filepath, key in [
        (shops, "/tmp/shops.csv", "shops/shops.csv"),
        (memberships, "/tmp/memberships.csv", "shops/memberships.csv"),
    ]:
        print(f"Escribiendo {filepath}...")
        try:
            write_csv(records, filepath)
        except Exception as e:
            print(f"ERROR: Fallo al escribir {filepath}: {e}")
            sys.exit(1)

        print(f"Subiendo a s3://{bucket}/{key}...")
        try:
            upload_to_s3(filepath, bucket, key)
        except Exception as e:
            print(f"ERROR: Fallo al subir {filepath} a S3: {e}")
            sys.exit(1)

        print(f"✓ {filepath} subido con {len(records)} registros")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Correr tests — todos deben pasar**

```bash
cd DataIngest/ingest-shops
python -m pytest tests/test_main.py -v
```

Salida esperada: 7 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add DataIngest/ingest-shops/
git commit -m "feat(etl): ingest-shops container MySQL to CSV with tests"
```

---

## Task 4: ingest-products — MongoDB → products.json → S3

**Files:**
- Create: `DataIngest/ingest-products/main.py`
- Create: `DataIngest/ingest-products/tests/__init__.py`
- Create: `DataIngest/ingest-products/tests/test_main.py`

- [ ] **Step 1: Crear `DataIngest/ingest-products/tests/__init__.py`**

Archivo vacío.

- [ ] **Step 2: Crear `DataIngest/ingest-products/tests/test_main.py`**

```python
import json
import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from bson import ObjectId

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# --- extract_products ---

def test_extract_products_returns_list_of_dicts():
    from main import extract_products

    mock_doc = {
        "_id": ObjectId("507f1f77bcf86cd799439011"),
        "name": "Producto A",
        "price": 99.99,
        "description": "Desc",
        "imageUrl": "https://picsum.photos/seed/1/400/400",
        "availability": "AVAILABLE",
        "shopId": "shop-uuid-1",
    }
    mock_collection = MagicMock()
    mock_collection.find.return_value = [mock_doc]

    result = extract_products(mock_collection)

    assert len(result) == 1
    assert result[0]["name"] == "Producto A"
    assert result[0]["price"] == 99.99
    assert isinstance(result[0]["id"], str)


def test_extract_products_converts_objectid_to_str():
    from main import extract_products

    oid = ObjectId("507f1f77bcf86cd799439011")
    mock_doc = {
        "_id": oid,
        "name": "P",
        "price": 1.0,
        "description": "",
        "imageUrl": "https://picsum.photos/seed/1/400/400",
        "availability": "AVAILABLE",
        "shopId": "s1",
    }
    mock_collection = MagicMock()
    mock_collection.find.return_value = [mock_doc]

    result = extract_products(mock_collection)

    assert result[0]["id"] == str(oid)


def test_extract_products_calls_find_all():
    from main import extract_products

    mock_collection = MagicMock()
    mock_collection.find.return_value = []

    extract_products(mock_collection)

    mock_collection.find.assert_called_once_with({})


# --- write_json ---

def test_write_json_creates_valid_json(tmp_path):
    from main import write_json

    records = [{"id": "1", "name": "Producto A", "price": 9.99}]
    filepath = str(tmp_path / "products.json")
    write_json(records, filepath)

    with open(filepath, encoding="utf-8") as f:
        loaded = json.load(f)

    assert len(loaded) == 1
    assert loaded[0]["name"] == "Producto A"


def test_write_json_writes_empty_array(tmp_path):
    from main import write_json

    filepath = str(tmp_path / "empty.json")
    write_json([], filepath)

    with open(filepath, encoding="utf-8") as f:
        loaded = json.load(f)

    assert loaded == []


# --- upload_to_s3 ---

def test_upload_to_s3_calls_boto3(tmp_path):
    from main import upload_to_s3

    filepath = str(tmp_path / "products.json")
    with open(filepath, "w") as f:
        f.write("[]")

    with patch("main.boto3") as mock_boto3:
        mock_s3 = MagicMock()
        mock_boto3.client.return_value = mock_s3
        upload_to_s3(filepath, "my-bucket", "products/products.json")

    mock_s3.upload_file.assert_called_once_with(
        filepath, "my-bucket", "products/products.json"
    )
```

- [ ] **Step 3: Verificar que los tests fallan**

```bash
cd DataIngest/ingest-products
pip install -r requirements.txt -q
python -m pytest tests/test_main.py -v 2>&1 | head -10
```

Salida esperada: `ModuleNotFoundError: No module named 'main'`

- [ ] **Step 4: Crear `DataIngest/ingest-products/main.py`**

```python
import json
import os
import sys
import boto3
import pymongo


def get_collection():
    client = pymongo.MongoClient(os.environ["MONGO_URI"])
    db_name = os.environ.get("MONGO_DB", "productdb")
    return client[db_name]["products"]


def extract_products(collection) -> list:
    records = []
    for doc in collection.find({}):
        records.append({
            "id": str(doc.get("_id", "")),
            "name": doc.get("name", ""),
            "price": doc.get("price", 0),
            "description": doc.get("description", ""),
            "imageUrl": str(doc.get("imageUrl", "")),
            "availability": doc.get("availability", ""),
            "shopId": str(doc.get("shopId", "")),
        })
    return records


def write_json(records: list, filepath: str) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def upload_to_s3(filepath: str, bucket: str, key: str) -> None:
    s3 = boto3.client("s3")
    s3.upload_file(filepath, bucket, key)


def main():
    print("=== ingest-products: iniciando ===")

    print("Conectando a MongoDB...")
    try:
        collection = get_collection()
    except Exception as e:
        print(f"ERROR: No se pudo conectar a MongoDB: {e}")
        sys.exit(1)

    print("Extrayendo productos...")
    try:
        records = extract_products(collection)
    except Exception as e:
        print(f"ERROR: Fallo al extraer productos: {e}")
        sys.exit(1)

    print(f"  {len(records)} registros extraídos")

    filepath = "/tmp/products.json"
    print(f"Escribiendo {filepath}...")
    try:
        write_json(records, filepath)
    except Exception as e:
        print(f"ERROR: Fallo al escribir JSON: {e}")
        sys.exit(1)

    bucket = os.environ["S3_BUCKET"]
    key = "products/products.json"
    print(f"Subiendo a s3://{bucket}/{key}...")
    try:
        upload_to_s3(filepath, bucket, key)
    except Exception as e:
        print(f"ERROR: Fallo al subir a S3: {e}")
        sys.exit(1)

    print(f"✓ products.json subido con {len(records)} registros")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Correr tests — todos deben pasar**

```bash
cd DataIngest/ingest-products
python -m pytest tests/test_main.py -v
```

Salida esperada: 7 tests PASSED.

- [ ] **Step 6: Commit**

```bash
git add DataIngest/ingest-products/
git commit -m "feat(etl): ingest-products container MongoDB to JSON with tests"
```

---

## Task 5: Queries Athena — archivo SQL de referencia

**Files:**
- Create: `DataIngest/athena_queries.sql`

- [ ] **Step 1: Crear `DataIngest/athena_queries.sql`**

```sql
-- ============================================================
-- MakeShop — AWS Athena Queries
-- Base de datos: makeshop_catalog
-- ============================================================

-- ============================================================
-- QUERY 1: Productos con nombre de tienda
-- ============================================================
SELECT
    p.id          AS product_id,
    p.name        AS product_name,
    p.price,
    p.availability,
    s.name        AS shop_name
FROM makeshop_catalog.products p
JOIN makeshop_catalog.shops s
    ON p.shopid = s.id;


-- ============================================================
-- QUERY 2: Usuarios con su tienda asignada
-- ============================================================
SELECT
    u.id          AS user_id,
    u.name        AS user_name,
    u.email,
    u.role,
    s.name        AS shop_name
FROM makeshop_catalog.users u
LEFT JOIN makeshop_catalog.shops s
    ON u.shop_id = s.id
WHERE u.role = 'USER';


-- ============================================================
-- QUERY 3: Miembros por tienda con su rol
-- ============================================================
SELECT
    s.name        AS shop_name,
    u.name        AS user_name,
    u.email,
    m.role        AS membership_role
FROM makeshop_catalog.memberships m
JOIN makeshop_catalog.shops s
    ON m.shop_id = s.id
JOIN makeshop_catalog.users u
    ON m.user_id = u.id
ORDER BY s.name;


-- ============================================================
-- QUERY 4: Resumen de productos y usuarios por tienda
-- ============================================================
SELECT
    s.name                  AS shop_name,
    COUNT(DISTINCT p.id)    AS total_products,
    COUNT(DISTINCT u.id)    AS total_users
FROM makeshop_catalog.shops s
LEFT JOIN makeshop_catalog.products p
    ON p.shopid = s.id
LEFT JOIN makeshop_catalog.users u
    ON u.shop_id = s.id
GROUP BY s.name
ORDER BY total_products DESC;


-- ============================================================
-- VISTA 1: v_tienda_resumen
-- Resumen de cada tienda con totales de productos y usuarios
-- ============================================================
CREATE OR REPLACE VIEW makeshop_catalog.v_tienda_resumen AS
SELECT
    s.id                    AS shop_id,
    s.name                  AS shop_name,
    s.phone_number,
    COUNT(DISTINCT p.id)    AS total_products,
    COUNT(DISTINCT u.id)    AS total_users
FROM makeshop_catalog.shops s
LEFT JOIN makeshop_catalog.products p
    ON p.shopid = s.id
LEFT JOIN makeshop_catalog.users u
    ON u.shop_id = s.id
GROUP BY s.id, s.name, s.phone_number;


-- ============================================================
-- VISTA 2: v_usuarios_tienda
-- Usuarios con información de su tienda y membresía
-- ============================================================
CREATE OR REPLACE VIEW makeshop_catalog.v_usuarios_tienda AS
SELECT
    u.id                    AS user_id,
    u.name                  AS user_name,
    u.email,
    u.role,
    s.name                  AS shop_name,
    m.role                  AS membership_role
FROM makeshop_catalog.users u
LEFT JOIN makeshop_catalog.shops s
    ON u.shop_id = s.id
LEFT JOIN makeshop_catalog.memberships m
    ON m.user_id = u.id
    AND m.shop_id = s.id;
```

- [ ] **Step 2: Commit**

```bash
git add DataIngest/athena_queries.sql
git commit -m "docs(etl): add Athena SQL queries and views file"
```

---

## Task 6: Diagrama Entidad / Relación

**Files:**
- Create: `DataIngest/ER_diagram.md`

- [ ] **Step 1: Crear `DataIngest/ER_diagram.md`**

```markdown
# Diagrama Entidad / Relación — MakeShop Data Catalog

Base de datos Glue: `makeshop_catalog`

## Tablas

### users (PostgreSQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | PK |
| name | string | Nombre completo |
| email | string | Email único |
| phone_number | string | Teléfono |
| role | string | OWNER / USER / ADMIN / CLIENT |
| subscription | string | FREE / PRO / MAX |
| shop_id | string (UUID) | FK → shops.id |
| enabled | boolean | Cuenta activa |
| email_verified | boolean | Email verificado |
| token_version | int | Versión del JWT |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

### shops (MySQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (UUID) | PK |
| name | string | Nombre único de la tienda |
| owner_id | string (UUID) | FK → users.id |
| phone_number | string | Teléfono de contacto |

### memberships (MySQL → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | int | PK |
| user_id | string (UUID) | FK → users.id |
| role | string | Rol dentro de la tienda |
| shop_id | string (UUID) | FK → shops.id |

### products (MongoDB → S3 → Glue)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string (ObjectId) | PK |
| name | string | Nombre del producto |
| price | double | Precio |
| description | string | Descripción |
| imageUrl | string | URL de imagen en S3 |
| availability | string | AVAILABLE / OUT_OF_STOCK |
| shopId | string (UUID) | FK → shops.id |

## Relaciones

```
users ──────────────────────────────────── shops
│  id ◄──────── owner_id                    │ id
│  id ◄──── user_id ──── memberships        │
│  shop_id ──────────────────────────────► id
                                            │ id
                          products.shopId ──┘
```

| Relación | Desde | Hacia | Cardinalidad |
|----------|-------|-------|--------------|
| Dueño de tienda | shops.owner_id | users.id | N:1 |
| Usuario de tienda | users.shop_id | shops.id | N:1 |
| Membresía usuario | memberships.user_id | users.id | N:1 |
| Membresía tienda | memberships.shop_id | shops.id | N:1 |
| Producto de tienda | products.shopId | shops.id | N:1 |
```

- [ ] **Step 2: Commit**

```bash
git add DataIngest/ER_diagram.md
git commit -m "docs(etl): add ER diagram for Glue catalog tables"
```
