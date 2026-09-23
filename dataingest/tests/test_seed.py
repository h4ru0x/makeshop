import os
import pytest

# Set env vars before importing seed so sys.exit is not triggered
os.environ["STORE_SERVICE_URL"] = "http://test-store:8004"
os.environ["NUM_SHOPS"] = "2"
os.environ["PRODUCTS_PER_SHOP"] = "3"
os.environ["USERS_PER_SHOP"] = "4"
os.environ["CONCURRENCY"] = "5"

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from seed import (
    STORE_SERVICE_URL,
    NUM_SHOPS,
    PRODUCTS_PER_SHOP,
    USERS_PER_SHOP,
    CONCURRENCY,
    gen_owner,
    gen_shop,
    gen_product,
    gen_shop_user,
    register_owner,
    login,
    create_shop,
    create_product,
    create_shop_user,
)


# --- Config ---
def test_config_reads_store_service_url():
    assert STORE_SERVICE_URL == "http://test-store:8004"


def test_config_reads_num_shops():
    assert NUM_SHOPS == 2


def test_config_reads_products_per_shop():
    assert PRODUCTS_PER_SHOP == 3


def test_config_reads_users_per_shop():
    assert USERS_PER_SHOP == 4


def test_config_reads_concurrency():
    assert CONCURRENCY == 5


# --- Generators ---
def test_gen_owner_has_required_fields():
    owner = gen_owner(1)
    assert "name" in owner
    assert "email" in owner
    assert "password" in owner
    assert "phoneNumber" in owner


def test_gen_owner_email_is_unique_per_index():
    a = gen_owner(1)
    b = gen_owner(2)
    assert a["email"].endswith("@seed.dev")
    assert b["email"].endswith("@seed.dev")
    assert a["password"] != b["password"]


def test_gen_owner_password_meets_requirements():
    pw = gen_owner(7)["password"]
    assert any(c.isupper() for c in pw)
    assert any(c.islower() for c in pw)
    assert any(c.isdigit() for c in pw)


def test_gen_shop_has_required_fields():
    shop = gen_shop(1)
    assert "shopName" in shop
    assert "phoneNumber" in shop
    assert len(shop["shopName"]) > 0


def test_gen_product_has_required_fields():
    product = gen_product(1, 1)
    assert "name" in product
    assert "imageUrl" in product
    assert "price" in product
    assert "description" in product


def test_gen_product_image_url_is_picsum():
    product = gen_product(5, 2)
    assert product["imageUrl"].startswith("https://picsum.photos/seed/")


def test_gen_product_price_in_range():
    for i in range(20):
        price = gen_product(i, 1)["price"]
        assert 1.0 <= price <= 999.99


def test_gen_shop_user_has_required_fields():
    user = gen_shop_user(1, "shop-uuid-123")
    assert "email" in user
    assert "password" in user
    assert user["shopId"] == "shop-uuid-123"


def test_gen_shop_user_password_meets_requirements():
    pw = gen_shop_user(3, "shop-uuid-123")["password"]
    assert any(c.isupper() for c in pw)
    assert any(c.islower() for c in pw)
    assert any(c.isdigit() for c in pw)


# --- API clients ---
import asyncio
import respx
import httpx

BASE = "http://test-store:8004"


@pytest.mark.asyncio
@respx.mock
async def test_register_owner_posts_to_auth_register():
    respx.post(f"{BASE}/auth/register").mock(
        return_value=httpx.Response(200, json={"id": "uid-1", "token": "tok"})
    )
    async with httpx.AsyncClient() as client:
        result = await register_owner(client, {"email": "a@b.com", "password": "Pass123!", "name": "A"})
    assert result == {"id": "uid-1", "token": "tok"}


@pytest.mark.asyncio
@respx.mock
async def test_register_owner_raises_on_error():
    respx.post(f"{BASE}/auth/register").mock(
        return_value=httpx.Response(400, json={"error": "Email already in use"})
    )
    async with httpx.AsyncClient() as client:
        with pytest.raises(httpx.HTTPStatusError):
            await register_owner(client, {"email": "dup@b.com", "password": "Pass123!", "name": "A"})


@pytest.mark.asyncio
@respx.mock
async def test_login_returns_token():
    respx.post(f"{BASE}/auth/login").mock(
        return_value=httpx.Response(200, json={"token": "jwt-abc", "id": "uid-1"})
    )
    async with httpx.AsyncClient() as client:
        token = await login(client, "a@b.com", "Pass123!")
    assert token == "jwt-abc"


@pytest.mark.asyncio
@respx.mock
async def test_create_shop_sends_auth_header():
    route = respx.post(f"{BASE}/openshop/shop").mock(
        return_value=httpx.Response(201, json={"id": "shop-uuid", "name": "Mi Tienda"})
    )
    async with httpx.AsyncClient() as client:
        result = await create_shop(client, {"shopName": "Mi Tienda", "phoneNumber": "123"}, "jwt-abc")
    assert result["id"] == "shop-uuid"
    assert route.calls[0].request.headers["authorization"] == "Bearer jwt-abc"


@pytest.mark.asyncio
@respx.mock
async def test_create_product_returns_true_on_success():
    respx.post(f"{BASE}/shops/shop-uuid/products").mock(
        return_value=httpx.Response(201, json={"productId": "prod-1"})
    )
    sem = asyncio.Semaphore(5)
    async with httpx.AsyncClient() as client:
        ok = await create_product(
            client, "shop-uuid",
            {"name": "P", "imageUrl": "https://picsum.photos/seed/1/400/400", "price": 9.99, "description": "desc"},
            "jwt-abc", sem
        )
    assert ok is True


@pytest.mark.asyncio
@respx.mock
async def test_create_product_returns_false_on_error():
    respx.post(f"{BASE}/shops/shop-uuid/products").mock(
        return_value=httpx.Response(500)
    )
    sem = asyncio.Semaphore(5)
    async with httpx.AsyncClient() as client:
        ok = await create_product(
            client, "shop-uuid",
            {"name": "P", "imageUrl": "https://picsum.photos/seed/1/400/400", "price": 9.99, "description": "desc"},
            "jwt-abc", sem
        )
    assert ok is False


@pytest.mark.asyncio
@respx.mock
async def test_create_shop_user_returns_true_on_success():
    respx.post(f"{BASE}/auth/register").mock(
        return_value=httpx.Response(200, json={"id": "user-1"})
    )
    sem = asyncio.Semaphore(5)
    async with httpx.AsyncClient() as client:
        ok = await create_shop_user(
            client, {"email": "u@b.com", "password": "Pass123!", "shopId": "shop-uuid"}, sem
        )
    assert ok is True


@pytest.mark.asyncio
@respx.mock
async def test_create_shop_user_returns_false_on_error():
    respx.post(f"{BASE}/auth/register").mock(
        return_value=httpx.Response(400, json={"error": "Email already in use"})
    )
    sem = asyncio.Semaphore(5)
    async with httpx.AsyncClient() as client:
        ok = await create_shop_user(
            client, {"email": "dup@b.com", "password": "Pass123!", "shopId": "shop-uuid"}, sem
        )
    assert ok is False


# --- Orchestrator ---
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_seed_shop_returns_zero_when_register_fails():
    with patch("seed.register_owner", new=AsyncMock(side_effect=Exception("Network error"))):
        sem = asyncio.Semaphore(5)
        async with httpx.AsyncClient() as client:
            from seed import seed_shop
            result = await seed_shop(client, 1, sem)
    assert result["shop"] is False
    assert result["products"] == 0
    assert result["users"] == 0


@pytest.mark.asyncio
async def test_seed_shop_returns_zero_when_login_fails():
    with (
        patch("seed.register_owner", new=AsyncMock(return_value={"id": "uid-1"})),
        patch("seed.login", new=AsyncMock(side_effect=Exception("Login error"))),
    ):
        sem = asyncio.Semaphore(5)
        async with httpx.AsyncClient() as client:
            from seed import seed_shop
            result = await seed_shop(client, 1, sem)
    assert result["shop"] is False
    assert result["products"] == 0
    assert result["users"] == 0


@pytest.mark.asyncio
async def test_seed_shop_returns_zero_when_create_shop_fails():
    with (
        patch("seed.register_owner", new=AsyncMock(return_value={"id": "uid-1"})),
        patch("seed.login", new=AsyncMock(return_value="jwt-abc")),
        patch("seed.create_shop", new=AsyncMock(side_effect=Exception("Shop creation failed"))),
    ):
        sem = asyncio.Semaphore(5)
        async with httpx.AsyncClient() as client:
            from seed import seed_shop
            result = await seed_shop(client, 1, sem)
    assert result["shop"] is False
    assert result["products"] == 0
    assert result["users"] == 0


@pytest.mark.asyncio
async def test_seed_shop_returns_counts_on_full_success():
    # Use side_effect lists so products return True and users return False
    # This makes the slice split verifiable: products=PRODUCTS_PER_SHOP, users=0
    product_results = [True] * PRODUCTS_PER_SHOP
    user_results = [False] * USERS_PER_SHOP
    all_results = product_results + user_results

    call_count = {"n": 0}

    async def mock_create(*args, **kwargs):
        result = all_results[call_count["n"]]
        call_count["n"] += 1
        return result

    with (
        patch("seed.register_owner", new=AsyncMock(return_value={"id": "uid-1"})),
        patch("seed.login", new=AsyncMock(return_value="jwt-abc")),
        patch("seed.create_shop", new=AsyncMock(return_value={"id": "shop-uuid", "name": "Tienda"})),
        patch("seed.create_product", new=AsyncMock(side_effect=[True] * PRODUCTS_PER_SHOP)),
        patch("seed.create_shop_user", new=AsyncMock(side_effect=[False] * USERS_PER_SHOP)),
    ):
        sem = asyncio.Semaphore(5)
        async with httpx.AsyncClient() as client:
            from seed import seed_shop
            result = await seed_shop(client, 1, sem)
    assert result["shop"] is True
    assert result["products"] == PRODUCTS_PER_SHOP
    assert result["users"] == 0
