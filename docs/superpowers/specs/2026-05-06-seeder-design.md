# Seeder Script — Design Spec
**Date:** 2026-05-06  
**Project:** MakeShop  
**Author:** Los-1000

---

## Objetivo

Script Python de ingesta de datos para poblar el entorno de MakeShop con datos de prueba realistas:
- 10 tiendas, cada una con su propio owner administrador
- 200 productos por tienda
- 100 usuarios normales por tienda

---

## Arquitectura

### Punto de entrada único

Todo el tráfico del script va contra **store-service** (el orquestador público):

```
STORE_SERVICE_URL=http://<IP>:8004
```

store-service expone todos los endpoints necesarios y proxea internamente a user-service, shop-service y product-service. No se llama a ningún servicio interno directamente.

### Carpeta dedicada

```
backend/seeder/
├── seed.py          # script principal
├── .env.example     # plantilla de variables de entorno
└── requirements.txt # dependencias: httpx, faker, python-dotenv
```

### Dependencias

| Librería | Uso |
|----------|-----|
| `httpx[http2]` | Cliente HTTP async |
| `faker` | Generación de datos realistas |
| `python-dotenv` | Carga del archivo `.env` |

---

## Configuración

Variables de entorno (archivo `.env` en `backend/seeder/`):

```env
STORE_SERVICE_URL=http://TU_IP:8004   # requerido — sin default
NUM_SHOPS=10
PRODUCTS_PER_SHOP=200
USERS_PER_SHOP=100
CONCURRENCY=20
```

Si `STORE_SERVICE_URL` no está definida, el script termina con un mensaje de error claro indicando qué variable configurar.

---

## Flujo de ejecución

Para cada tienda (secuencial entre tiendas):

```
1. POST /auth/register
   Body: { name, email, password, phoneNumber }
   → Crea owner con rol OWNER y plan FREE (máx. 1 tienda)

2. POST /auth/login
   Body: { identifier: email, password }
   → Obtiene JWT del owner

3. POST /openshop/shop
   Headers: Authorization: Bearer <jwt>
   Body: { shopName, phoneNumber }
   → Crea la tienda; retorna shopId

4. [Paralelo con semáforo de CONCURRENCY=20]
   POST /auth/register × USERS_PER_SHOP
   Body: { email, password, shopId }
   → Crea usuarios normales (rol USER) asociados a la tienda

   POST /shops/{shopId}/products × PRODUCTS_PER_SHOP
   Headers: Authorization: Bearer <jwt>
   Body: { name, imageUrl, price, description }
   → Crea productos; imageUrl usa picsum.photos
```

### Generación de datos

| Campo | Fuente |
|-------|--------|
| Nombres de owner/usuario | `faker` (locale `es`) |
| Emails | `faker` con dominio único por seed |
| Passwords | Patrón fijo válido: `Seed1234!{i}` (cumple los requisitos del user-service: mayúscula, minúscula, número) |
| Nombres de tienda | `faker` empresa + sufijo numérico para garantizar unicidad |
| Teléfonos | `faker` número de teléfono |
| Nombres de producto | `faker` palabras/productos en español |
| Precios | Aleatorio entre 1.00 y 999.99 |
| Descripción de producto | `faker` frase corta |
| imageUrl | `https://picsum.photos/seed/{i}/400/400` |

---

## Concurrencia

- Las 10 tiendas se procesan **en secuencia** (una a la vez) para facilitar el seguimiento de errores.
- Dentro de cada tienda, productos y usuarios se crean **en paralelo** usando `asyncio.gather` con un `asyncio.Semaphore(CONCURRENCY)`.
- Default de concurrencia: 20 requests simultáneos.

---

## Manejo de errores

- Si falla el registro del owner o la creación de la tienda → el script imprime el error y pasa a la siguiente tienda.
- Si falla la creación de un producto o usuario individual → se registra el error y se continúa con los demás.
- Al finalizar se imprime un resumen: tiendas creadas, productos creados, usuarios creados, fallos.

---

## Salida esperada

```
[1/10] Registrando owner: owner1@makeshop.dev ...OK
[1/10] Creando tienda: TiendaEjemplo S.A. ...OK (shopId: abc-123)
[1/10] Creando 200 productos y 100 usuarios en paralelo...
[1/10] ✓ 200 productos | 100 usuarios
...
=============================
Resumen final:
  Tiendas creadas:  10 / 10
  Productos creados: 2000 / 2000
  Usuarios creados: 1000 / 1000
  Fallos: 0
=============================
```

---

## Restricciones conocidas

- Cada owner tiene plan **FREE** (límite: 1 tienda). El script respeta esto creando exactamente 1 tienda por owner.
- El password de owners y usuarios cumple el patrón requerido por user-service: al menos 1 mayúscula, 1 minúscula, 1 número.
- Los emails deben ser únicos globalmente en la plataforma.
- El nombre de tienda debe ser único (aplicado por shop-service).
