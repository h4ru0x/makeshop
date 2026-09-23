import os
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from uuid import uuid4

import boto3
from botocore.client import BaseClient
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile


class S3Uploader:
    def __init__(self) -> None:
        self.bucket_name = os.getenv("BUCKET_NAME", "").strip()
        self.client: BaseClient = boto3.client("s3")

    def _build_key(self, filename: str | None) -> str:
        ext = Path(filename or "").suffix
        if len(ext) > 10:
            ext = ""
        return f"products/{uuid4()}{ext}"

    async def upload_image(self, file: UploadFile) -> str:
        if not self.bucket_name:
            raise ValueError("BUCKET_NAME is required")

        if not file.content_type or not file.content_type.startswith("image/"):
            raise ValueError("Only image files are allowed")

        key = self._build_key(file.filename)
        self.client.upload_fileobj(
            file.file,
            self.bucket_name,
            key,
            ExtraArgs={"ContentType": file.content_type},
        )

        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=3600,
        )

    def _extract_key_from_url(self, image_url: str) -> str | None:
        parsed = urlparse(image_url)

        query_key = parse_qs(parsed.query).get("Key")
        if query_key:
            return unquote(query_key[0])

        path = parsed.path.lstrip("/")
        if path.startswith(f"{self.bucket_name}/"):
            return path[len(self.bucket_name) + 1 :]

        if path:
            return unquote(path)

        return None

    async def delete_image_by_url(self, image_url: str | None) -> None:
        if not self.bucket_name or not image_url:
            return

        key = self._extract_key_from_url(image_url)
        if not key:
            return

        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
        except NoCredentialsError:
            print(f"S3 deletion skipped: No credentials found for key {key}")
        except Exception as e:
            print(f"S3 deletion failed for key {key}: {e}")

s3_uploader = S3Uploader()
