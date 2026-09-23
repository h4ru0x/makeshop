# MakeShop

Plataforma de e-commerce open source, autohosteable y basada en microservicios. Permite gestionar múltiples tiendas, productos y usuarios con una arquitectura desacoplada lista para nube.

## Servicios

| Directorio | Tecnología | Responsabilidad |
|---|---|---|
| `frontend/` | React + TypeScript + Vite | Interfaz del cliente y panel de propietario |
| `backend/user-service/` | Java + Spring Boot | Autenticación y gestión de usuarios |
| `backend/shop-service/` | TypeScript + Express + Prisma | Gestión de tiendas |
| `backend/store-service/` | TypeScript + Express | Orquestación entre servicios |
| `backend/product-service/` | Python + FastAPI | Catálogo de productos e imágenes (S3) |
| `dataingest/` | Python | Scripts de ingesta y seed de datos hacia AWS |
| `cloud-aws/` | AWS CloudFormation | Infraestructura declarativa en nube |

## Inicio rápido (local)

```bash
cd backend
cp .env.example .env  # configurar variables
docker-compose up
```

## Documentación

La documentación técnica completa está disponible en [`docs/index.html`](docs/index.html), con secciones para:

- **API** — endpoints por servicio
- **Frontend** — arquitectura y flujos de UI
- **Infraestructura** — recursos AWS y red
- **Despliegue** — paso a paso con CloudFormation + Amplify
- **Data Ingest** — scripts de ingesta y queries Athena
