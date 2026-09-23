import os
import uuid
import random
from datetime import datetime

import bcrypt
import psycopg2
import pymysql
import pymongo
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

f = Faker("es")
Faker.seed(42)
random.seed(42)

PG_HOST    = os.getenv("POSTGRES_HOST", "172.31.11.149")
MY_HOST    = os.getenv("MYSQL_HOST", "172.31.11.149")
MG_URI     = os.getenv("MONGO_URI", "mongodb://admin:admin123@172.31.11.149:27017/productdb")
N_SHOPS    = int(os.getenv("NUM_SHOPS", "100"))
N_USERS    = int(os.getenv("USERS_PER_SHOP", "100"))
N_PRODUCTS = int(os.getenv("PRODUCTS_PER_SHOP", "200"))

PWD_PLAIN = b"OpenStore1!"
PWD_HASH  = bcrypt.hashpw(PWD_PLAIN, bcrypt.gensalt(10)).decode()
TS = datetime.utcnow()

shop_ids  = [uuid.uuid4() for _ in range(N_SHOPS)]
owner_ids = [uuid.uuid4() for _ in range(N_SHOPS)]

print(f"Password para todos los usuarios: OpenStore1!")
print(f"Generando {N_SHOPS} tiendas, {N_PRODUCTS} productos/tienda, {N_USERS} usuarios/tienda...\n")


# ---------------------------------------------------------------------------
# PostgreSQL — owners + usuarios normales
# ---------------------------------------------------------------------------
print("[1/3] Insertando usuarios en PostgreSQL...")
pg = psycopg2.connect(
    host=PG_HOST, port=5432,
    dbname="userdb", user="admin", password="admin123"
)
cur = pg.cursor()

user_rows = []

for i in range(N_SHOPS):
    user_rows.append((
        str(owner_ids[i]), f.name(),
        f"owner{i + 1}@openstore.seed",
        f.numerify("3#########"),
        "OWNER", "FREE", None,
        PWD_HASH, True, True, 0, TS, TS,
    ))

all_user_ids = []
for i in range(N_SHOPS):
    shop_user_ids = []
    for j in range(N_USERS):
        uid = uuid.uuid4()
        shop_user_ids.append(uid)
        user_rows.append((
            str(uid), f.name(),
            f"user{i * N_USERS + j + 1}@openstore.seed",
            f.numerify("3#########"),
            "USER", None, str(shop_ids[i]),
            PWD_HASH, True, True, 0, TS, TS,
        ))
    all_user_ids.append(shop_user_ids)

cur.executemany(
    """
    INSERT INTO users
        (id, name, email, phone_number, role, subscription, shop_id,
         password, enabled, email_verified, token_version, created_at, updated_at)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    ON CONFLICT (email) DO NOTHING
    """,
    user_rows,
)
pg.commit()
pg.close()
print(f"  ✓ {len(user_rows)} usuarios insertados")


# ---------------------------------------------------------------------------
# MySQL — shops + memberships
# ---------------------------------------------------------------------------
print("\n[2/3] Insertando tiendas en MySQL...")
my = pymysql.connect(
    host=MY_HOST, port=3307,
    db="shopdb", user="admin", password="admin123"
)
cur = my.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS Shop (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(191) UNIQUE NOT NULL,
        owner_id VARCHAR(36) NOT NULL,
        phone_number VARCHAR(191) NOT NULL
    )
""")
cur.execute("""
    CREATE TABLE IF NOT EXISTS Membership (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        role VARCHAR(191) NOT NULL,
        shop_id VARCHAR(36) NOT NULL,
        FOREIGN KEY (shop_id) REFERENCES Shop(id)
    )
""")
my.commit()

shop_rows = [
    (str(shop_ids[i]), f.company()[:80] + f" #{i + 1}", str(owner_ids[i]), f.numerify("3#########"))
    for i in range(N_SHOPS)
]
cur.executemany(
    "INSERT IGNORE INTO Shop (id, name, owner_id, phone_number) VALUES (%s,%s,%s,%s)",
    shop_rows,
)

mem_rows = []
for i in range(N_SHOPS):
    mem_rows.append((str(owner_ids[i]), "OWNER", str(shop_ids[i])))
    for uid in all_user_ids[i]:
        mem_rows.append((str(uid), "USER", str(shop_ids[i])))

cur.executemany(
    "INSERT IGNORE INTO Membership (user_id, role, shop_id) VALUES (%s,%s,%s)",
    mem_rows,
)
my.commit()
my.close()
print(f"  ✓ {N_SHOPS} tiendas y {len(mem_rows)} membresías insertadas")


# ---------------------------------------------------------------------------
# MongoDB — productos
# ---------------------------------------------------------------------------
print("\n[3/3] Insertando productos en MongoDB...")
client = pymongo.MongoClient(MG_URI)
col = client["productdb"]["products"]

products = []
for i in range(N_SHOPS):
    for j in range(N_PRODUCTS):
        products.append({
            "name": f.catch_phrase(),
            "price": round(random.uniform(1.0, 999.99), 2),
            "description": f.sentence(),
            "imageUrl": f"https://picsum.photos/seed/{i * 1000 + j}/400/400",
            "availability": random.choice(["AVAILABLE", "AVAILABLE", "AVAILABLE", "OUT_OF_STOCK"]),
            "shopId": str(shop_ids[i]),
            "createdAt": TS,
        })

col.insert_many(products)
client.close()
print(f"  ✓ {len(products)} productos insertados")


# ---------------------------------------------------------------------------
# Resumen
# ---------------------------------------------------------------------------
total = len(user_rows) + N_SHOPS + len(mem_rows) + len(products)
print(f"""
{'=' * 45}
Resumen final:
  Tiendas:          {N_SHOPS}
  Owners:           {N_SHOPS}
  Usuarios normales:{N_SHOPS * N_USERS}
  Membresías:       {len(mem_rows)}
  Productos:        {N_SHOPS * N_PRODUCTS}
  Total registros:  {total}
{'=' * 45}
""")
