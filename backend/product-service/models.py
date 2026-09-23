from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl


class Availability(str, Enum):
    AVAILABLE = "AVAILABLE"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class Product(BaseModel):
    id: UUID
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    description: str = Field(default="")
    imageUrl: HttpUrl | None = None
    availability: Availability
    shopId: UUID


class ProductListItem(BaseModel):
    productId: UUID
    imageUrl: HttpUrl | None = None
    name: str
    description: str = Field(default="")
    price: float
    availability: Availability


class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    imageUrl: HttpUrl | None = None
    price: float = Field(ge=0)
    description: str = Field(default="")


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, ge=0)
    availability: Availability | None = None
    imageUrl: HttpUrl | None = None


class ProductIdResponse(BaseModel):
    productId: UUID
