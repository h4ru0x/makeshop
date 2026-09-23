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
