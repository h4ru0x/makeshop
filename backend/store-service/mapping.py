from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator


def resolved_shop_id(shop_id: Optional[str]) -> Optional[str]:
	"""Normaliza shopId vacío a None para elegir flujo OWNER vs usuario de tienda."""
	if shop_id is None:
		return None
	stripped = shop_id.strip()
	return stripped if stripped else None


class AuthLoginRequest(BaseModel):
	identifier: str = Field(min_length=1, description="Email o identificador según user-service")
	password: str = Field(min_length=1)
	shopId: Optional[str] = Field(
		default=None,
		description="Si se omite, login como OWNER. Si se envía, login en el contexto de esa tienda.",
	)


class AuthRegisterRequest(BaseModel):
	email: str = Field(min_length=1)
	password: str = Field(
		min_length=8,
		description="Requisitos del user-service: mayúscula, minúscula y número",
	)
	shopId: Optional[str] = Field(
		default=None,
		description="Sin shopId: registro como OWNER (crear tienda). Con shopId: usuario de esa tienda.",
	)
	name: Optional[str] = Field(
		default=None,
		description="Obligatorio si no hay shopId (flujo OWNER)",
	)
	phoneNumber: Optional[str] = Field(default=None, description="Opcional en ambos flujos")

	@model_validator(mode="after")
	def validate_owner_needs_name(self) -> "AuthRegisterRequest":
		if resolved_shop_id(self.shopId) is None:
			if not self.name or not self.name.strip():
				raise ValueError("name es obligatorio cuando no se envía shopId (registro como OWNER)")
		return self


class VerifyPasswordRequest(BaseModel):
	email: str = Field(min_length=1)
	password: str = Field(min_length=1)


class UpdateMeRequest(BaseModel):
	name: Optional[str] = None
	email: Optional[str] = None
	phoneNumber: Optional[str] = None
	password: Optional[str] = None
	code: str = Field(min_length=1)


class UpdateSubscriptionRequest(BaseModel):
	subscription: str = Field(min_length=1, description="Plan de suscripción (ej: FREE, PREMIUM, MAX)")


def build_register_payload(request: AuthRegisterRequest) -> dict[str, Any]:
	"""OWNER → RegisterRequest; usuario de tienda → ShopRegisterRequest (user-service)."""
	sid = resolved_shop_id(request.shopId)
	if sid is None:
		name_val = request.name
		if not name_val or not name_val.strip():
			raise ValueError("name es obligatorio para registro OWNER")
		body: dict[str, Any] = {
			"email": request.email.strip(),
			"password": request.password,
			"name": name_val.strip(),
		}
		if request.phoneNumber and request.phoneNumber.strip():
			body["phoneNumber"] = request.phoneNumber.strip()
		return body
	body = {
		"email": request.email.strip(),
		"password": request.password,
	}
	if request.phoneNumber and request.phoneNumber.strip():
		body["phone"] = request.phoneNumber.strip()
	return body


class ShopCreateRequest(BaseModel):
	shopName: str = Field(min_length=1)
	phoneNumber: str = Field(min_length=1, description="Teléfono de la tienda")
	themeKey: Optional[str] = Field(default=None, description="Clave del tema visual (dev, enterprise, ghetto)")
	config: Optional[dict[str, Any]] = Field(default=None, description="Configuración del tema: colores, headerName, hero")


class ShopUpdateRequest(BaseModel):
	shopName: Optional[str] = None
	phoneNumber: Optional[str] = None

	@model_validator(mode="after")
	def validate_at_least_one_field(self) -> "ShopUpdateRequest":
		if not self.shopName and not self.phoneNumber:
			raise ValueError("Debes enviar shopName, phoneNumber o ambos")
		return self


class ThemeUpdateRequest(BaseModel):
	themeKey: Optional[str] = Field(default=None, description="Clave del tema (dev, enterprise, ghetto)")
	config: Optional[dict[str, Any]] = Field(default=None, description="Configuración: colores, headerName, hero")

	@model_validator(mode="after")
	def validate_at_least_one(self) -> "ThemeUpdateRequest":
		if self.themeKey is None and self.config is None:
			raise ValueError("Debes enviar themeKey, config o ambos")
		return self


def build_shop_create_payload(request: ShopCreateRequest) -> dict[str, Any]:
	payload: dict[str, Any] = {
		"shopName": request.shopName.strip(),
		"phoneNumber": request.phoneNumber.strip(),
	}
	if request.themeKey is not None:
		payload["themeKey"] = request.themeKey
	if request.config is not None:
		payload["config"] = request.config
	return payload


def build_shop_update_payload(request: ShopUpdateRequest) -> dict[str, str]:
	payload: dict[str, str] = {}
	if request.shopName is not None:
		payload["shopName"] = request.shopName.strip()
	if request.phoneNumber is not None:
		payload["phoneNumber"] = request.phoneNumber.strip()
	return payload
