from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError

from models import Availability, Product, ProductCreateRequest, ProductListItem


class NotFoundError(Exception):
    pass


class BadRequestError(Exception):
    pass


class ForbiddenError(Exception):
    pass


@dataclass(frozen=True)
class ShopPayload:
    shop_id: str
    owner_id: str
    shop_name: str


@dataclass(frozen=True)
class UserPayload:
    user_id: str
    role: str


class ExternalServiceClient:
    def __init__(self) -> None:
        self.store_service_url = os.getenv("STORE_SERVICE_URL", "http://store-service:8004").rstrip("/")

    async def get_current_user(self, authorization: str | None) -> UserPayload:
        if not authorization:
            raise ForbiddenError("Acceso denegado. Token no proporcionado.")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.store_service_url}/me",
                headers={"Authorization": authorization, "Content-Type": "application/json"},
            )

        if response.status_code == 401:
            raise ForbiddenError("Acceso denegado. Token no proporcionado.")
        if response.status_code in {403, 404}:
            raise ForbiddenError("Token invalido o expirado.")
        if not response.is_success:
            raise BadRequestError("No se pudo obtener la informacion del usuario")

        payload = response.json()
        user_id = payload.get("id")
        role = str(payload.get("role", "")).strip().upper()

        if user_id is None:
            raise BadRequestError("El payload de /me no incluye id de usuario")

        return UserPayload(user_id=str(user_id), role=role)

    async def get_shop(self, shop_id: str) -> ShopPayload:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self.store_service_url}/shop/id/{shop_id}/owner")

        if response.status_code == 404:
            raise NotFoundError("Shop not found")
        if not response.is_success:
            raise BadRequestError("No se pudo verificar la tienda")

        payload = response.json()
        owner_id = payload.get("ownerId")
        shop_name = ""

        if owner_id is None:
            raise BadRequestError("La tienda no incluye ownerId")

        return ShopPayload(shop_id=str(payload.get("shopId", shop_id)), owner_id=str(owner_id), shop_name=shop_name)


class ProductRepository:
    def __init__(self) -> None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/productdb")
        self.client = AsyncIOMotorClient(mongo_uri)
        database_name = os.getenv("MONGO_DATABASE", "productdb")
        self.collection = self.client[database_name]["products"]
        self._indexes_ready = False
        self._index_lock = asyncio.Lock()

    async def ensure_indexes(self) -> None:
        if self._indexes_ready:
            return

        async with self._index_lock:
            if self._indexes_ready:
                return

            await self.collection.create_index([("shop_id", 1), ("name_key", 1)], unique=True)
            self._indexes_ready = True

    @staticmethod
    def _normalize_name(name: str) -> str:
        return name.strip().casefold()

    @staticmethod
    def _list_item_from_document(document: dict[str, Any]) -> ProductListItem:
        # Soporta tanto snake_case (image_url) como camelCase (imageUrl) por compatibilidad
        raw_image_url = document.get("image_url") or document.get("imageUrl")
        # Sanitizar el string literal "None" que documentos legacy pueden tener guardado
        if isinstance(raw_image_url, str):
            raw_image_url = raw_image_url.strip() or None
        if raw_image_url == "None":
            raw_image_url = None
        return ProductListItem(
            productId=document["_id"],
            imageUrl=raw_image_url,
            name=str(document["name"]),
            description=str(document.get("description", "")),
            price=float(document["price"]),
            availability=Availability(str(document["availability"])),
        )

    async def list_products(self, shop_id: str) -> list[ProductListItem]:
        await self.ensure_indexes()
        cursor = self.collection.find({"shop_id": shop_id}).sort("created_at", 1)
        items: list[ProductListItem] = []
        async for document in cursor:
            items.append(self._list_item_from_document(document))
        return items

    async def create_product(
        self,
        shop_id: str,
        payload: ProductCreateRequest,
        *,
        image_url: str | None,
        owner_id: str,
    ) -> str:
        await self.ensure_indexes()
        now = datetime.now(timezone.utc)
        product_id = str(uuid4())
        document = {
            "_id": product_id,
            "shop_id": shop_id,
            "owner_id": owner_id,
            "name": payload.name.strip(),
            "name_key": self._normalize_name(payload.name),
            "price": float(payload.price),
            "description": payload.description,
            "image_url": image_url,
            "availability": Availability.AVAILABLE.value,
            "created_at": now,
            "updated_at": now,
        }

        try:
            await self.collection.insert_one(document)
        except DuplicateKeyError as exc:
            raise BadRequestError("A product with the same name already exists in this shop") from exc

        return product_id

    async def _find_product(self, shop_id: str, product_id: str) -> dict[str, Any]:
        await self.ensure_indexes()
        document = await self.collection.find_one({"_id": product_id, "shop_id": shop_id})
        if not document:
            raise NotFoundError("Product not found for this shop")
        return document

    async def update_product(
        self,
        shop_id: str,
        product_id: str,
        *,
        name: str | None = None,
        price: float | None = None,
        availability: Availability | None = None,
        image_url: str | None = None,
    ) -> None:
        await self.ensure_indexes()
        current = await self._find_product(shop_id, product_id)

        update_fields: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
        if name is not None:
            update_fields["name"] = name.strip()
            update_fields["name_key"] = self._normalize_name(name)
        if price is not None:
            update_fields["price"] = float(price)
        if availability is not None:
            update_fields["availability"] = availability.value
        if image_url is not None:
            update_fields["image_url"] = image_url

        if len(update_fields) == 1:
            raise BadRequestError("At least one field must be provided")

        try:
            await self.collection.update_one({"_id": current["_id"], "shop_id": current["shop_id"]}, {"$set": update_fields})
        except DuplicateKeyError as exc:
            raise BadRequestError("A product with the same name already exists in this shop") from exc

    async def delete_product(self, shop_id: str, product_id: str) -> str | None:
        await self.ensure_indexes()
        current = await self._find_product(shop_id, product_id)
        await self.collection.delete_one({"_id": current["_id"], "shop_id": current["shop_id"]})
        raw = current.get("image_url") or current.get("imageUrl")
        if not isinstance(raw, str) or raw in ("", "None"):
            return None
        return raw

    async def delete_products_by_shop(self, shop_id: str) -> list[str]:
        await self.ensure_indexes()
        cursor = self.collection.find({"shop_id": shop_id}, {"image_url": 1})
        image_urls: list[str] = []
        async for document in cursor:
            image_url = str(document.get("image_url", "")).strip()
            if image_url:
                image_urls.append(image_url)

        await self.collection.delete_many({"shop_id": shop_id})
        return image_urls


external_service_client = ExternalServiceClient()
product_repository = ProductRepository()