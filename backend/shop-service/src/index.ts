import { swaggerDocs } from './swagger';
import express, { Request, Response } from 'express';
import cors from 'cors';
import type { Prisma } from '@prisma/client';
const { PrismaClient } = require('@prisma/client');

type ShopRecord = { id: string; owner_id: string; name: string; phone_number: string };
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from './middleware/auth';
import membershipService from './services/membershipService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.SHOP_SERVICE_PORT;
const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL;

const DEFAULT_STOREFRONT_THEME_KEY = 'dev';
const ALLOWED_STOREFRONT_THEME_KEYS = new Set(['dev', 'enterprise', 'ghetto']);

const normalizeStorefrontThemeKey = (raw: unknown): string => {
  if (typeof raw !== 'string' || !raw.trim()) {
    return DEFAULT_STOREFRONT_THEME_KEY;
  }
  const k = raw.trim();
  return ALLOWED_STOREFRONT_THEME_KEYS.has(k) ? k : DEFAULT_STOREFRONT_THEME_KEY;
};

// Configuración CORS mejorada
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: false,
  optionsSuccessStatus: 200,
}));

app.use(express.json());

type MePayload = {
  id: number | string;
  role: 'OWNER' | 'ADMIN' | 'USER' | string;
  subscription?: 'FREE' | 'PRO' | 'MAX' | string;
  subscriptionPlan?: 'FREE' | 'PRO' | 'MAX' | string;
  phoneNumber?: string;
};

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 5,
  MAX: Number.POSITIVE_INFINITY,
};

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  return token || null;
};

const buildMeUrl = (): string => {
  return `${STORE_SERVICE_URL}/me`;
}

const getCurrentUserFromMe = async (token: string): Promise<MePayload> => {
  const response = await fetch(buildMeUrl(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la informacion del usuario desde /me');
  }

  const user = (await response.json()) as MePayload;
  if (!user.id) {
    throw new Error('El payload de /me no incluye id de usuario');
  }

  return user;
};

const toShopResponse = (shop: ShopRecord) => ({
  shopId: shop.id,
  ownerId: shop.owner_id,
  shopName: shop.name,
  phoneNumber: shop.phone_number,
});

const getPlanLimit = (plan: string): number | null => {
  const normalized = plan.toUpperCase();
  return PLAN_LIMITS[normalized] ?? null;
};

const getUserPlan = (user: MePayload): string => {
  return String(user.subscription ?? user.subscriptionPlan ?? 'FREE').toUpperCase();
};


app.get('/', (req: Request, res: Response) => {
  res.redirect('/healthcheck');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'shop-service' });
});

app.get('/healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'shop-service' });
});

app.get('/shops', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        skip,
        take: limit,
      }),
      prisma.shop.count(),
    ]);

    res.json({
      data: shops.map(toShopResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error in /shops:', error);
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
});



app.post('/openshop/shop', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { shopName, phoneNumber, themeKey, config } = req.body ?? {};

  if (!shopName || typeof shopName !== 'string' || !shopName.trim()) {
    return res.status(400).json({ error: 'shopName es obligatorio' });
  }

  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    return res.status(400).json({ error: 'phoneNumber es obligatorio' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const ownerId = String(user.id);

    if (!ownerId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    if (String(user.role).toUpperCase() !== 'OWNER') {
      return res.status(403).json({ error: 'Unete a Openshop para registrar una tienda' });
    }

    const plan = getUserPlan(user);
    const maxAllowedShops = getPlanLimit(plan);

    if (maxAllowedShops === null) {
      return res.status(400).json({ error: 'Plan de suscripcion invalido' });
    }

    const existingByName = await prisma.shop.findFirst({
      where: { name: shopName.trim() },
    });

    if (existingByName) {
      return res.status(409).json({ error: 'Este nombre ya esta en uso' });
    }

    const ownerShopsCount = await prisma.shop.count({
      where: { owner_id: ownerId },
    });

    if (ownerShopsCount >= maxAllowedShops) {
      return res.status(403).json({
        error: `Has alcanzado el limite de tiendas para el plan ${plan}`,
      });
    }

    const resolvedThemeKey = normalizeStorefrontThemeKey(themeKey);
    const resolvedConfig = config && typeof config === 'object' ? config : {};

    const newShop = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const shop = await tx.shop.create({
        data: {
          name: shopName.trim(),
          owner_id: ownerId,
          phone_number: phoneNumber.trim(),
        },
      });
      await tx.shopTheme.create({
        data: {
          shopId: shop.id,
          themeKey: resolvedThemeKey,
          config: resolvedConfig,
        },
      });
      return shop;
    });

    return res.status(201).json(toShopResponse(newShop));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al crear la tienda' });
  }
});


app.get('/shop/name/:shopName', async (req: Request, res: Response) => {
  const shopName = String(req.params.shopName ?? '');

  try {
    const shop = await prisma.shop.findFirst({
      where: { name: shopName },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    return res.json({
      shopName: shop.name,
      shopId: shop.id,
      phoneNumber: shop.phone_number,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la tienda por nombre' });
  }
});



app.delete('/shop/id/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.shopId);

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const requesterId = String(user.id);

    if (!requesterId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    const existingShop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    if (existingShop.owner_id !== requesterId) {
      return res.status(403).json({ error: 'No puedes eliminar una tienda que no te pertenece' });
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    return res.json({ shopId });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la tienda' });
  }
});

app.delete('/internal/shops/:shopId', async (req: Request, res: Response) => {

  const shopId = String(req.params.shopId);
  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  try {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    await prisma.shop.delete({ where: { id: shopId } });
    return res.json({ shopId });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la tienda' });
  }
});

// GET /shop/owner/{ownerId} - Get all shops for an owner
app.get('/shop/owner/:ownerId', async (req: Request, res: Response) => {
  const ownerId = String(req.params.ownerId);

  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId invalido' });
  }

  try {
    const shops = await prisma.shop.findMany({
      where: { owner_id: ownerId },
    });

    const response = shops.map((shop: ShopRecord) => ({
      shopId: shop.id,
      shopName: shop.name,
      shopNumber: shop.id, // using id as shop number
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tiendas del propietario' });
  }
});

// GET /shop/:shopId/theme — configuración visual pública del storefront (sin auth)
app.get('/shop/:shopId/theme', async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId ?? '').trim();

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    let theme = await prisma.shopTheme.findUnique({
      where: { shopId },
    });

    if (!theme) {
      theme = await prisma.shopTheme.create({
        data: {
          shopId,
          themeKey: DEFAULT_STOREFRONT_THEME_KEY,
          config: {},
        },
      });
    }

    const themeKey = normalizeStorefrontThemeKey(theme.themeKey);

    return res.json({
      shopId: shop.id,
      themeKey,
      config: theme.config ?? {},
      updatedAt: theme.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el tema de la tienda' });
  }
});

// PUT /shop/:shopId/theme — guarda configuración de tema (requiere auth)
app.put('/shop/:shopId/theme', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.shopId ?? '').trim();
  const { themeKey, config } = req.body ?? {};

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const requesterId = String(user.id);

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const isAdmin = String(user.role).toUpperCase() === 'ADMIN';
    if (!isAdmin && shop.owner_id !== requesterId) {
      return res.status(403).json({ error: 'No puedes modificar el tema de una tienda que no te pertenece' });
    }

    const resolvedThemeKey = normalizeStorefrontThemeKey(themeKey);
    const resolvedConfig = config && typeof config === 'object' ? config : {};

    const updated = await prisma.shopTheme.upsert({
      where: { shopId },
      create: { shopId, themeKey: resolvedThemeKey, config: resolvedConfig },
      update: { themeKey: resolvedThemeKey, config: resolvedConfig },
    });

    return res.json({
      shopId,
      themeKey: updated.themeKey,
      config: updated.config ?? {},
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el tema de la tienda' });
  }
});


// GET /shop/{shopId} - Get shop details by ID
app.get('/shop/:shopId', async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    res.json({
      ownerId: shop.owner_id,
      phoneNumber: shop.phone_number,
      shopId: shop.id,
      shopName: shop.name,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tienda' });
  }
});

// PATCH /shop/{shopId} - Update shop details
app.patch('/shop/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.shopId);
  const { shopName, phoneNumber } = req.body ?? {};

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  if (!shopName && !phoneNumber) {
    return res.status(400).json({ error: 'Debes enviar shopName, phoneNumber o ambos' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const requesterId = String(user.id);

    if (!requesterId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    const existingShop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    if (existingShop.owner_id !== requesterId) {
      return res.status(403).json({ error: 'No puedes modificar una tienda que no te pertenece' });
    }

    if (shopName && typeof shopName === 'string') {
      const duplicatedName = await prisma.shop.findFirst({
        where: {
          name: shopName.trim(),
          NOT: { id: shopId },
        },
      });

      if (duplicatedName) {
        return res.status(409).json({ error: 'Este nombre ya esta en uso' });
      }
    }

    const data: { name?: string; phone_number?: string } = {};
    if (shopName && typeof shopName === 'string') data.name = shopName.trim();
    if (phoneNumber && typeof phoneNumber === 'string') data.phone_number = phoneNumber.trim();

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data,
    });

    res.json({
      ownerId: updatedShop.owner_id,
      phoneNumber: updatedShop.phone_number,
      shopId: updatedShop.id,
      shopName: updatedShop.name,
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo actualizar la tienda' });
  }
});

swaggerDocs(app, Number(PORT));
app.post('/shops/:id/memberships', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.id);
  const { userId, role } = req.body;

  if (!req.body || !userId || !role) {
    return res.status(400).json({ error: 'Faltan datos obligatorios: userId y role' });
  }

  try {
    const newMembership = await membershipService.addMembership(
      String(userId), 
      shopId, 
      role
    );
    res.status(201).json(newMembership);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al agregar miembro a la tienda' });
  }
});

app.listen(PORT, () => {
  console.log(` Shop Service corriendo en http://localhost:${PORT}`);
});

