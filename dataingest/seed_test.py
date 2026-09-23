"""
seed_test.py — OpenStore test dataset (~500 records)

  50 owners  |  50 shops  |  50 themes  |  50 memberships  |  300 products
  Password para todos: OpenStore1

Usage:
    cp .env.example .env   # editar IPs
    pip install -r requirements.txt
    python seed_test.py
"""

import os, uuid, random
from datetime import datetime

import bcrypt, psycopg2, pymysql, pymongo
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

fake = Faker("es")
Faker.seed(42)
random.seed(42)

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
N_OWNERS      = 50
N_SHOPS       = 50    # 1 por owner
N_PRODUCTS    = 6     # por shop → 300 total
THEMES        = ["dev", "enterprise", "ghetto"]

PWD_HASH = bcrypt.hashpw(b"OpenStore1", bcrypt.gensalt(10)).decode()
TS = datetime.utcnow()

owner_ids = [str(uuid.uuid4()) for _ in range(N_OWNERS)]
shop_ids  = [str(uuid.uuid4()) for _ in range(N_SHOPS)]

print("=" * 50)
print("  OPENSTORE — seed_test (~500 registros)")
print("=" * 50)
print(f"  Owners: {N_OWNERS} | Shops: {N_SHOPS} | Products: {N_SHOPS * N_PRODUCTS}")
print(f"  Password: OpenStore1\n")

# ── 1. PostgreSQL — usuarios ─────────────────────────────────────────────────
print("[1/3] PostgreSQL — insertando owners...")
pg  = psycopg2.connect(host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASS)
cur = pg.cursor()

rows = []
for i in range(N_OWNERS):
    rows.append((
        owner_ids[i], fake.name(),
        f"owner{i+1}@test.seed",
        fake.numerify("9########"),
        "OWNER", "FREE", shop_ids[i],
        PWD_HASH, True, True, 0, TS, TS,
    ))

cur.executemany("""
    INSERT INTO users
        (id, name, email, phone_number, role, subscription, shop_id,
         password, enabled, email_verified, token_version, created_at, updated_at)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (email) DO NOTHING
""", rows)
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

used_names = set()
shop_rows = []
for i in range(N_SHOPS):
    name = (fake.company().replace(",", "").replace(".", "")[:80] + f" #{i+1}")
    while name in used_names:
        name += str(i)
    used_names.add(name)
    shop_rows.append((shop_ids[i], name, owner_ids[i], fake.numerify("9########")))

cur.executemany(
    "INSERT IGNORE INTO Shop (id, name, owner_id, phone_number) VALUES (%s,%s,%s,%s)",
    shop_rows,
)
my.commit()

theme_rows = []
for i in range(N_SHOPS):
    theme_rows.append((
        str(uuid.uuid4()), shop_ids[i],
        random.choice(THEMES), "{}",
        TS, TS,
    ))

cur.executemany(
    "INSERT IGNORE INTO ShopTheme (id, shopId, themeKey, config, createdAt, updatedAt) VALUES (%s,%s,%s,%s,%s,%s)",
    theme_rows,
)
my.commit()

mem_rows = [(owner_ids[i], "OWNER", shop_ids[i]) for i in range(N_SHOPS)]
cur.executemany(
    "INSERT IGNORE INTO Membership (user_id, role, shop_id) VALUES (%s,%s,%s)",
    mem_rows,
)
my.commit()
my.close()
print(f"  OK: {N_SHOPS} shops | {N_SHOPS} themes | {len(mem_rows)} memberships\n")

# ── 3. MongoDB — productos ───────────────────────────────────────────────────
print("[3/3] MongoDB — insertando productos...")
client = pymongo.MongoClient(MG_URI)
col    = client[MG_DB]["products"]

ADJS  = ["Premium","Deluxe","Pro","Ultra","Clásico","Moderno","Compacto","Resistente","Ligero","Elegante"]
BASES = ["Auriculares","Camiseta","Silla","Pelota","Crema","Muñeco","Novela","Granola","Cartera","Vitaminas",
         "Monitor","Zapatos","Mesa","Raqueta","Perfume","Patines","Cuaderno","Café","Mochila","Proteína"]

docs = []
for i, shop_id in enumerate(shop_ids):
    for j in range(N_PRODUCTS):
        name = f"{ADJS[j % 10]} {BASES[j % 20]}"
        docs.append({
            "_id":          str(uuid.uuid4()),
            "shop_id":      shop_id,
            "owner_id":     owner_ids[i],
            "name":         name,
            "name_key":     name.strip().casefold(),
            "price":        round(random.uniform(5.0, 499.99), 2),
            "description":  fake.sentence(nb_words=8),
            "image_url":    f"https://picsum.photos/seed/{i * 100 + j}/400/400",
            "availability": random.choice(["AVAILABLE", "AVAILABLE", "AVAILABLE", "OUT_OF_STOCK"]),
            "created_at":   TS,
            "updated_at":   TS,
        })

col.insert_many(docs)
client.close()
print(f"  OK: {len(docs)} productos\n")

# ── Resumen ──────────────────────────────────────────────────────────────────
total = N_OWNERS + N_SHOPS + N_SHOPS + len(mem_rows) + len(docs)
print("=" * 50)
print("  SEED TEST COMPLETADO")
print(f"  PostgreSQL users : {N_OWNERS}")
print(f"  MySQL shops      : {N_SHOPS}")
print(f"  MySQL themes     : {N_SHOPS}")
print(f"  MySQL memberships: {len(mem_rows)}")
print(f"  MongoDB products : {len(docs)}")
print(f"  TOTAL            : {total}")
print("=" * 50)
