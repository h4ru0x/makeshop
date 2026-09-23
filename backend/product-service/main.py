from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from models import Availability, ProductCreateRequest, ProductIdResponse, ProductListItem, ProductUpdateRequest
from s3 import s3_uploader
from services import BadRequestError, NotFoundError, product_service
from integrations import ForbiddenError

app = FastAPI(title="product-service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"service": "product-service", "status": "ok"}


@app.get("/healthcheck")
def healthcheck() -> dict[str, str]:
    return {"service": "product-service", "status": "ok"}


@app.get("/shops/{shop_id}/products", response_model=list[ProductListItem])
async def get_products(shop_id: str) -> list[ProductListItem]:
    try:
        return await product_service.list_products(shop_id)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BadRequestError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/shops/{shop_id}/products", response_model=ProductIdResponse, status_code=201)
async def create_product(
    shop_id: str,
    request: Request,
    name: str | None = Form(default=None),
    price: float | None = Form(default=None),
    description: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
) -> ProductIdResponse:
    content_type = request.headers.get("content-type", "")
    authorization = request.headers.get("authorization")

    try:
        if content_type.startswith("application/json"):
            data = await request.json()
            payload = ProductCreateRequest.model_validate(data)
            product_id = await product_service.create_product_with_url(shop_id, payload, authorization=authorization)
            return ProductIdResponse(productId=product_id)

        if content_type.startswith("multipart/form-data"):
            if name is None or price is None or description is None:
                raise HTTPException(status_code=400, detail="name, price and description are required")

            image_url = await s3_uploader.upload_image(file) if file is not None else None
            product_id = await product_service.create_product_with_uploaded_url(
                shop_id,
                authorization=authorization,
                name=name,
                price=price,
                description=description,
                image_url=image_url,
            )
            return ProductIdResponse(productId=product_id)

        raise HTTPException(status_code=400, detail="Unsupported Content-Type")
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BadRequestError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.patch("/shops/{shop_id}/products/{product_id}", status_code=204)
async def update_product(
    shop_id: str,
    product_id: str,
    request: Request,
    name: str | None = Form(default=None),
    price: float | None = Form(default=None),
    availability: Availability | None = Form(default=None),
    imageUrl: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
) -> None:
    content_type = request.headers.get("content-type", "")
    authorization = request.headers.get("authorization")

    try:
        if content_type.startswith("application/json"):
            data = await request.json()
            payload = ProductUpdateRequest.model_validate(data)
            await product_service.update_product(
                shop_id,
                product_id,
                authorization=authorization,
                name=payload.name,
                price=payload.price,
                availability=payload.availability,
                image_url=payload.imageUrl if payload.imageUrl else None,
            )
            return

        if content_type.startswith("multipart/form-data"):
            final_image_url = imageUrl
            if file is not None:
                final_image_url = await s3_uploader.upload_image(file)

            ProductUpdateRequest.model_validate(
                {
                    "name": name,
                    "price": price,
                    "availability": availability,
                    "imageUrl": final_image_url,
                }
            )

            await product_service.update_product(
                shop_id,
                product_id,
                authorization=authorization,
                name=name,
                price=price,
                availability=availability,
                image_url=final_image_url,
            )
            return

        raise HTTPException(status_code=400, detail="Unsupported Content-Type")
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BadRequestError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/shops/{shop_id}/products/{product_id}", status_code=204)
async def delete_product(shop_id: str, product_id: str, request: Request) -> None:
    authorization = request.headers.get("authorization")

    try:
        await product_service.delete_product(shop_id, product_id, authorization=authorization)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BadRequestError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/internal/shops/{shop_id}/products")
async def purge_products_by_shop(shop_id: str, request: Request) -> dict[str, int | str]:
    try:
        deleted_count = await product_service.purge_shop_products(shop_id, internal_token=None)
        return {"shopId": shop_id, "deletedProducts": deleted_count}
    except BadRequestError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc