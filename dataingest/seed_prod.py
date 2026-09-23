"""
seed_prod.py — OpenStore production dataset (~20,000 records)

  500 owners  |  1,000 shops  |  1,000 themes  |  1,000 memberships  |  17,000 products
  Password para todos: OpenStore1

Usage:
    cp .env.example .env   # editar IPs
    pip install -r requirements.txt
    python seed_prod.py
"""

import os, uuid, random
from datetime import datetime

import bcrypt, psycopg2, pymysql, pymongo
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

fake = Faker("es")
Faker.seed(99)
random.seed(99)

# ── Conexiones ──────────────────────────────────────────────────────────────
PG_HOST  = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT  = int(os.getenv("POSTGRES_PORT", 5432))
PG_DB    = os.getenv("POSTGRES_DB", "userdb")
PG_USER  = os.getenv("POSTGRES_USER", "admin")
PG_PASS  = os.getenv("POSTGRES_PASSWORD", "admin123")

MY_HOST  = os.getenv("MYSQL_HOST", "localhost")
MY_PORT  = int(os.getenv("MYSQL_PORT", 3307))
MY_DB    = os.getenv("MYSQL_DB", "shopdb")
MY_USER  = os.getenv("MYSQL_USER", "admin")
MY_PASS  = os.getenv("MYSQL_PASSWORD", "admin123")

MG_URI   = os.getenv("MONGO_URI", "mongodb://admin:admin123@localhost:27017/productdb?authSource=admin")
MG_DB    = os.getenv("MONGO_DB", "productdb")

# ── Volúmenes ────────────────────────────────────────────────────────────────
N_OWNERS         = 500
SHOPS_PER_OWNER  = 2      # → 1,000 shops
N_SHOPS          = N_OWNERS * SHOPS_PER_OWNER
N_PRODUCTS       = 17     # por shop → 17,000 total
THEMES           = ["dev", "enterprise", "ghetto"]
BATCH_PG         = 200    # filas por executemany en Postgres
BATCH_MG         = 500    # docs por insert_many en Mongo

SUBS = ["FREE"] * 6 + ["PRO"] * 3 + ["MAX"]   # 60% FREE, 30% PRO, 10% MAX

PWD_HASH = bcrypt.hashpw(b"OpenStore1", bcrypt.gensalt(10)).decode()
TS = datetime.utcnow()

owner_ids = [str(uuid.uuid4()) for _ in range(N_OWNERS)]
shop_ids  = [str(uuid.uuid4()) for _ in range(N_SHOPS)]

print("=" * 55)
print("  OPENSTORE — seed_prod (~20,000 registros)")
print("=" * 55)
print(f"  Owners: {N_OWNERS} | Shops: {N_SHOPS} | Products: {N_SHOPS * N_PRODUCTS}")
print(f"  Password: OpenStore1\n")

# ── 1. PostgreSQL — owners ───────────────────────────────────────────────────
print("[1/3] PostgreSQL — insertando owners...")
pg  = psycopg2.connect(host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASS)
cur = pg.cursor()

batch = []
for i in range(N_OWNERS):
    # Cada owner tiene shop_id apuntando a su primera tienda
    first_shop = shop_ids[i * SHOPS_PER_OWNER]
    batch.append((
        owner_ids[i], fake.name(),
        f"owner{i+1}@prod.seed",
        fake.numerify("9########"),
        "OWNER", random.choice(SUBS), first_shop,
        PWD_HASH, True, True, 0, TS, TS,
    ))
    if len(batch) >= BATCH_PG:
        cur.executemany("""
            INSERT INTO users
                (id, name, email, phone_number, role, subscription, shop_id,
                 password, enabled, email_verified, token_version, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (email) DO NOTHING
        """, batch)
        pg.commit()
        batch = []

if batch:
    cur.executemany("""
        INSERT INTO users
            (id, name, email, phone_number, role, subscription, shop_id,
             password, enabled, email_verified, token_version, created_at, updated_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (email) DO NOTHING
    """, batch)
    pg.commit()

pg.close()
print(f"  OK: {N_OWNERS} usuarios\n")

# ── 2. MySQL — shops, themes, memberships ────────────────────────────────────
print("[2/3] MySQL — insertando shops...")
my  = pymysql.connect(host=MY_HOST, port=MY_PORT, db=MY_DB, user=MY_USER, password=MY_PASS)
cur = my.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS Shop (
        id           VARCHAR(36)  PRIMARY KEY,
        name         VARCHAR(191) UNIQUE NOT NULL,
        owner_id     VARCHAR(36)  NOT NULL,
        phone_number VARCHAR(191) NOT NULL
    )
""")
cur.execute("""
    CREATE TABLE IF NOT EXISTS ShopTheme (
        id         VARCHAR(191) PRIMARY KEY,
        shopId     VARCHAR(191) UNIQUE NOT NULL,
        themeKey   VARCHAR(64)  NOT NULL,
        config     JSON         NOT NULL,
        createdAt  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt  DATETIME(3)  NOT NULL,
        FOREIGN KEY (shopId) REFERENCES Shop(id) ON DELETE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
""")
cur.execute("""
    CREATE TABLE IF NOT EXISTS Membership (
        id      INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36)  NOT NULL,
        role    VARCHAR(191) NOT NULL,
        shop_id VARCHAR(36)  NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES Shop(id)
    )
""")
my.commit()

used_names  = set()
shop_rows   = []
theme_rows  = []
mem_rows    = []

for i in range(N_OWNERS):
    for k in range(SHOPS_PER_OWNER):
        idx = i * SHOPS_PER_OWNER + k
        sid = shop_ids[idx]

        name = (fake.company().replace(",", "").replace(".", "")[:75] + f" #{idx+1}")
        while name in used_names:
            name += str(idx)
        used_names.add(name)

        shop_rows.append((sid, name, owner_ids[i], fake.numerify("9########")))
        theme_rows.append((str(uuid.uuid4()), sid, random.choice(THEMES), "{}", TS, TS))
        mem_rows.append((owner_ids[i], "OWNER", sid))

cur.executemany(
    "INSERT IGNORE INTO Shop (id, name, owner_id, phone_number) VALUES (%s,%s,%s,%s)",
    shop_rows,
)
my.commit()

cur.executemany(
    "INSERT IGNORE INTO ShopTheme (id, shopId, themeKey, config, createdAt, updatedAt) VALUES (%s,%s,%s,%s,%s,%s)",
    theme_rows,
)
my.commit()

cur.executemany(
    "INSERT IGNORE INTO Membership (user_id, role, shop_id) VALUES (%s,%s,%s)",
    mem_rows,
)
my.commit()
my.close()
print(f"  OK: {N_SHOPS} shops | {N_SHOPS} themes | {len(mem_rows)} memberships\n")

# ── 3. MongoDB — productos ───────────────────────────────────────────────────
print("[3/3] MongoDB — insertando productos...")
mongo_client = pymongo.MongoClient(MG_URI)
col          = mongo_client[MG_DB]["products"]

ADJS  = ["Premium","Deluxe","Pro","Ultra","Clásico","Moderno","Compacto","Resistente","Ligero","Elegante",
         "Original","Exclusivo","Natural","Orgánico","Smart","Mini","Max","Vintage","Sport","Eco"]
BASES = ["Auriculares","Camiseta","Silla","Pelota","Crema","Muñeco","Novela","Granola","Cartera","Vitaminas",
         "Monitor","Zapatos","Mesa","Raqueta","Perfume","Patines","Cuaderno","Café","Mochila","Proteína",
         "Lámpara","Reloj","Bicicleta","Cámara","Altavoz","Teclado","Manta","Aceite","Bolso","Tablet"]

# Mapeo shop_id → owner_id (owner i posee shops i*2 e i*2+1)
shop_owner_map = {}
for i in range(N_OWNERS):
    for k in range(SHOPS_PER_OWNER):
        shop_owner_map[shop_ids[i * SHOPS_PER_OWNER + k]] = owner_ids[i]

total_mg = 0
batch    = []

for i, shop_id in enumerate(shop_ids):
    for j in range(N_PRODUCTS):
        name = f"{ADJS[j % len(ADJS)]} {BASES[(i + j) % len(BASES)]}"
        batch.append({
            "_id":          str(uuid.uuid4()),
            "shop_id":      shop_id,
            "owner_id":     shop_owner_map[shop_id],
            "name":         name,
            "name_key":     name.strip().casefold(),
            "price":        round(random.uniform(5.0, 999.99), 2),
            "description":  fake.sentence(nb_words=10),
            "image_url":    f"https://picsum.photos/seed/{i * 100 + j}/400/400",
            "availability": random.choice(["AVAILABLE", "AVAILABLE", "AVAILABLE", "OUT_OF_STOCK"]),
            "created_at":   TS,
            "updated_at":   TS,
        })
        if len(batch) >= BATCH_MG:
            col.insert_many(batch)
            total_mg += len(batch)
            batch = []

    if (i + 1) % 100 == 0:
        print(f"  ... {i+1}/{N_SHOPS} shops procesadas ({total_mg} productos)")

if batch:
    col.insert_many(batch)
    total_mg += len(batch)

mongo_client.close()
print(f"  OK: {total_mg} productos\n")

# ── Resumen ──────────────────────────────────────────────────────────────────
total = N_OWNERS + N_SHOPS + N_SHOPS + len(mem_rows) + total_mg
print("=" * 55)
print("  SEED PROD COMPLETADO")
print(f"  PostgreSQL users : {N_OWNERS}")
print(f"  MySQL shops      : {N_SHOPS}")
print(f"  MySQL themes     : {N_SHOPS}")
print(f"  MySQL memberships: {len(mem_rows)}")
print(f"  MongoDB products : {total_mg}")
print(f"  TOTAL            : {total}")
print("=" * 55)
