import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPublicShopById, getShopPublicTheme } from '../../api/shop-service/shop-api';
import { getProductsByShop } from '../../api/product-service/product-api';
import { DEFAULT_THEME_KEY, THEME_REGISTRY } from './themeRegistry';
import { mapApiProductsToCatalog } from './mapCatalogProducts';
import type { ShopThemeJson } from './themeTypes';
import type { Product } from '../template/DevStyle';
import { getShopCurrentUser } from '../../api/user-service/user-service';
import UserShopPageLogin from '../template/UserShopPageLogin';

function decodeShopSlug(raw: string | undefined): string {
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function StorefrontPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const [searchParams] = useSearchParams();
  const id = (searchParams.get('id') ?? '').trim();
  const [loginOpen, setLoginOpen] = useState(false);

  const slugDecoded = useMemo(() => decodeShopSlug(shopSlug), [shopSlug]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [themeKey, setThemeKey] = useState(DEFAULT_THEME_KEY);
  const [themeConfig, setThemeConfig] = useState<ShopThemeJson | null>(null);
  const [shopSession, setShopSession] = useState(() => getShopCurrentUser(id));

  const palette = useMemo(() => {
    const colors = (themeConfig?.colors as Record<string, string> | undefined) ?? {};
    return {
      primary: colors.primaryColor ?? '#5b6cff',
      accent: colors.accentColor ?? '#7ee0b8',
      bg: colors.bgColor ?? '#0c111b',
      surface: `color-mix(in srgb, ${colors.bgColor ?? '#0c111b'} 84%, #000)`,
      text: colors.textColor ?? '#e8eefc',
      muted: '#8f9ab3',
      shadow: 'rgba(0,0,0,0.4)',
    };
  }, [themeConfig]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError(null);
      if (!slugDecoded) {
        setError('Ruta de tienda no válida.');
        setLoading(false);
        return;
      }
      if (!id) {
        setError('Falta el parámetro id  en la URL (ej. ?id=uuid-de-la-tienda).');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [shop, theme] = await Promise.all([
          getPublicShopById(id),
          getShopPublicTheme(id),
        ]);
        if (cancelled) return;

        const resolvedName = shop.shopName ?? shop.name ?? '';
        if (resolvedName !== slugDecoded) {
          setError('El nombre en la URL no coincide con la tienda indicada.');
          setLoading(false);
          return;
        }

        setShopId(shop.shopId ?? shop.id ?? id);
        setShopName(resolvedName);
        setThemeKey(theme.themeKey || DEFAULT_THEME_KEY);
        setThemeConfig((theme.config ?? {}) as ShopThemeJson);
        setShopSession(getShopCurrentUser(id));
      } catch (e) {
        if (!cancelled) {
          setError('No se pudo cargar la tienda o su tema. Comprueba el id y tu conexión al API.');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [slugDecoded, id]);

  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    if (!shopId || error) return;

    setShopSession(getShopCurrentUser(shopId));

    let cancelled = false;
    void (async () => {
      try {
        const rows = await getProductsByShop(shopId);
        if (cancelled) return;
        setCatalog(mapApiProductsToCatalog(rows));
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shopId, error]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        Cargando tienda…
      </div>
    );
  }

  if (error || !shopId) {
    return (
      <div style={{ padding: '3rem', maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Storefront</h1>
        <p style={{ color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  const ThemeComponent = THEME_REGISTRY[themeKey] ?? THEME_REGISTRY[DEFAULT_THEME_KEY];

  return (
    <>
      <ThemeComponent
        shopId={shopId}
        shopName={shopName}
        themeConfig={themeConfig}
        catalogProducts={catalog}
        hasActiveSession={Boolean(shopSession)}
      />

      {/* Botón flotante de login para visitantes no autenticados */}
      {!shopSession && !loginOpen && (
        <button
          onClick={() => setLoginOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: '1.75rem',
            zIndex: 500,
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
            color: '#000',
            border: 'none',
            borderRadius: '50px',
            padding: '0.75rem 1.5rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.875rem',
            boxShadow: `0 4px 20px ${palette.shadow}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 28px ${palette.shadow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 20px ${palette.shadow}`;
          }}
        >
          Iniciar sesión
        </button>
      )}

      {loginOpen && (
        <UserShopPageLogin
          shopId={shopId}
          shopName={shopName}
          themeKey={themeKey}
          themeConfig={themeConfig}
          onSuccess={() => {
            setShopSession(getShopCurrentUser(shopId));
            setLoginOpen(false);
          }}
          onClose={() => setLoginOpen(false)}
        />
      )}
    </>
  );
}
