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
        (shops, "/tmp/shops.csv", "shops_csv/shops.csv"),
        (memberships, "/tmp/memberships.csv", "memberships_csv/memberships.csv"),
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
