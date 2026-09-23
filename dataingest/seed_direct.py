import os, uuid, random
from datetime import datetime
import bcrypt, psycopg2, pymysql, pymongo
from faker import Faker
from dotenv import load_dotenv

load_dotenv()

f = Faker('es')
Faker.seed(42)
random.seed(42)

PG_HOST = os.getenv('POSTGRES_HOST', '172.31.11.149')
MY_HOST = os.getenv('MYSQL_HOST', '172.31.11.149')
MG_URI  = os.getenv('MONGO_URI', 'mongodb://admin:admin123@172.31.11.149:27017/productdb?authSource=admin')

N_SHOPS    = 100
N_STAFF    = 5
N_CLIENTS  = 50
N_PRODUCTS = 200

PWD_HASH = bcrypt.hashpw(b'OpenStore1', bcrypt.gensalt(10)).decode()
TS = datetime.utcnow()

shop_ids  = [uuid.uuid4() for _ in range(N_SHOPS)]
owner_ids = [uuid.uuid4() for _ in range(N_SHOPS)]
print(f"Password para todos: OpenStore1")
print(f"Generando {N_SHOPS} tiendas, {N_PRODUCTS} productos/tienda...")

# ── PostgreSQL ──────────────────────────────────────────────────
print("\n[1/3] Insertando usuarios en PostgreSQL...")
pg  = psycopg2.connect(host=PG_HOST, port=5432, dbname='userdb', user='admin', password='admin123')
cur = pg.cursor()

user_rows = []
staff_ids_per_shop = []

for i in range(N_SHOPS):
    # Owner
    user_rows.append((
        str(owner_ids[i]), f.name(),
        f'owner{i+1}@openstore.seed',
        f.numerify('9########'),
        'OWNER', 'FREE', str(shop_ids[i]),
        PWD_HASH, True, True, 0, TS, TS
    ))
    # Staff
    shop_staff = []
    for j in range(N_STAFF):
        uid = uuid.uuid4()
        shop_staff.append(uid)
        user_rows.append((
            str(uid), f.name(),
            f'staff{i*N_STAFF+j+1}@openstore.seed',
            f.numerify('9########'),
            'USER', 'FREE', str(shop_ids[i]),
            PWD_HASH, True, True, 0, TS, TS
        ))
    staff_ids_per_shop.append(shop_staff)
    # Clients
    for j in range(N_CLIENTS):
        user_rows.append((
            str(uuid.uuid4()), f.name(),
            f'client{i*N_CLIENTS+j+1}@openstore.seed',
            f.numerify('9########'),
            'CLIENT', 'FREE', str(shop_ids[i]),
            PWD_HASH, True, True, 0, TS, TS
        ))
    if (i+1) % 10 == 0:
        cur.executemany("""
            INSERT INTO users
            (id, name, email, phone_number, role, subscription, shop_id,
             password, enabled, email_verified, token_version, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (email) DO NOTHING
        """, user_rows)
        pg.commit()
        print(f"  ... {(i+1)*(1+N_STAFF+N_CLIENTS)} usuarios insertados")
        user_rows = []

if user_rows:
    cur.executemany("""
        INSERT INTO users
        (id, name, email, phone_number, role, subscription, shop_id,
         password, enabled, email_verified, token_version, created_at, updated_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (email) DO NOTHING
    """, user_rows)
    pg.commit()

total_pg = N_SHOPS * (1 + N_STAFF + N_CLIENTS)
pg.close()
print(f"  PostgreSQL OK: {total_pg} usuarios")

# ── MySQL ───────────────────────────────────────────────────────
print("\n[2/3] Insertando tiendas en MySQL...")
my  = pymysql.connect(host=MY_HOST, port=3307, db='shopdb', user='admin', password='admin123')
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

used = set()
shop_rows = []
for i in range(N_SHOPS):
    name = f.company().replace(',','').replace('.','')[:80] + f' #{i+1}'
    while name in used:
        name += str(i)
    used.add(name)
    shop_rows.append((str(shop_ids[i]), name, str(owner_ids[i]), f.numerify('9########')))

cur.executemany("INSERT IGNORE INTO Shop (id, name, owner_id, phone_number) VALUES (%s,%s,%s,%s)", shop_rows)
my.commit()

mem_rows = []
for i in range(N_SHOPS):
    mem_rows.append((str(owner_ids[i]), 'OWNER', str(shop_ids[i])))
    for uid in staff_ids_per_shop[i]:
        mem_rows.append((str(uid), 'STAFF', str(shop_ids[i])))

cur.executemany("INSERT IGNORE INTO Membership (user_id, role, shop_id) VALUES (%s,%s,%s)", mem_rows)
my.commit()
my.close()
print(f"  MySQL OK: {N_SHOPS} tiendas, {len(mem_rows)} memberships")

# ── MongoDB ─────────────────────────────────────────────────────
print("\n[3/3] Insertando productos en MongoDB...")
client = pymongo.MongoClient(MG_URI)
db  = client['productdb']
col = db['products']

adjs  = ['Premium','Deluxe','Pro','Ultra','Clasico','Moderno','Compacto','Resistente','Ligero','Elegante']
bases = ['Auriculares','Camiseta','Silla','Pelota','Crema','Muneco','Novela','Granola','Cartera','Vitaminas',
         'Monitor','Zapatos','Mesa','Raqueta','Perfume','Patines','Cuaderno','Cafe','Mochila','Proteina']

total_mg = 0
for i in range(N_SHOPS):
    batch = []
    for j in range(N_PRODUCTS):
        batch.append({
            'id':           str(uuid.uuid4()),
            'name':         f"{adjs[j%10]} {bases[j%20]} v{j//20+1}",
            'price':        round(random.uniform(5.0, 999.99), 2),
            'description':  f.sentence(nb_words=10),
            'imageUrl':     f'https://picsum.photos/seed/{i*1000+j}/400/400',
            'availability': random.choice(['AVAILABLE','AVAILABLE','AVAILABLE','OUT_OF_STOCK']),
            'shopId':       str(shop_ids[i]),
            'createdAt':    TS
        })
    col.insert_many(batch)
    total_mg += len(batch)
    if (i+1) % 10 == 0:
        print(f"  ... {total_mg} productos insertados")

client.close()
print(f"  MongoDB OK: {total_mg} productos")

grand_total = total_pg + N_SHOPS + len(mem_rows) + total_mg
print(f"""
{'='*45}
SEED COMPLETADO
  PostgreSQL users : {total_pg}
  MySQL shops      : {N_SHOPS}
  MySQL memberships: {len(mem_rows)}
  MongoDB products : {total_mg}
  TOTAL            : {grand_total}
{'='*45}
""")
