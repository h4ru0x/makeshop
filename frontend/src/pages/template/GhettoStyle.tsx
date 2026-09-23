import { useState } from 'react';
import WhatsAppButton from './WhatsAppButton';
import type { Product } from './DevStyle';
import type { ThemeViewProps } from '../storefront/themeTypes';
import { hasConfiguredHeroTitle, readHeroSubtitle, readHeroTitle } from '../storefront/themeTypes';

function GhettoProductCard({
  product,
  quantity,
  onIncrease,
  onDecrease,
}: {
  product: Product;
  quantity: number;
  onIncrease: (p: Product) => void;
  onDecrease: (p: Product) => void;
}) {

  const badgeColors: Record<string, string> = {
    HOT: '#ff2d55', NEW: '#00f5d4', SALE: '#ffd60a', FREE: '#bf5af2',
  };

  return (
    <div className="gh-card">
      <div className="gh-card-tape" />
      <div className="gh-card-inner">
        {product.imageUrl && (
          <div style={{ marginBottom: '1rem', border: '2px solid #222', overflow: 'hidden' }}>
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: '100%', height: '190px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
        <div className="gh-card-top">
          {product.badge && (
            <span className="gh-badge" style={{ background: badgeColors[product.badge] ?? '#ff2d55' }}>
              {product.badge}
            </span>
          )}
        </div>
        <h3 className="gh-card-title">{product.name}</h3>
        <p className="gh-card-desc">{product.description}</p>
        <div className="gh-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="gh-price">${product.price}</span>
            <span style={{ fontSize: '0.78rem', color: product.availability === 'OUT_OF_STOCK' ? '#ff6b6b' : 'var(--gh-accent)', fontWeight: 700 }}>
              {product.availability === 'OUT_OF_STOCK' ? 'Out of stock' : 'Available'}
            </span>
          </div>
          <div className="gh-qty-controls">
            <button className="gh-btn gh-btn-small" onClick={() => onDecrease(product)} disabled={quantity === 0}>
              -
            </button>
            <span className="gh-qty-value">{quantity}</span>
            <button
              className="gh-btn gh-btn-small"
              onClick={() => onIncrease(product)}
              disabled={product.availability === 'OUT_OF_STOCK'}
              title={product.availability === 'OUT_OF_STOCK' ? 'Producto agotado' : 'Añadir'}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function readGhColors(themeConfig: import('../storefront/themeTypes').ShopThemeJson | null) {
  const c = themeConfig?.colors as Record<string, string> | undefined;
  return {
    primary: c?.primaryColor ?? '#ff2d55',
    bg: c?.bgColor ?? '#0e0e0e',
    text: c?.textColor ?? '#f0f0f0',
    accent: c?.accentColor ?? '#ffcc00',
    headerName: (themeConfig?.headerName as string) ?? '',
  };
}

export default function GhettoStyle({ shopId, shopName, themeConfig, catalogProducts }: ThemeViewProps) {
  const [cart, setCart] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const productSource = catalogProducts ?? [];
  const showCustomHero = hasConfiguredHeroTitle(themeConfig);
  const ghColors = readGhColors(themeConfig);
  const displayHeader = ghColors.headerName || shopName;
  const hasProducts = productSource.length > 0;
  const EMPTY_PRODUCTS_MESSAGE = 'There are no products available yet, please check back soon';

  const cartSummary = cart.reduce<Record<number, { product: Product; quantity: number }>>((acc, product) => {
    const current = acc[product.id];
    if (current) {
      current.quantity += 1;
    } else {
      acc[product.id] = { product, quantity: 1 };
    }
    return acc;
  }, {});

  const cartEntries = Object.values(cartSummary);
  const cartItemCount = cartEntries.reduce((total, entry) => total + entry.quantity, 0);

  const filtered = productSource.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  // Do not add out-of-stock products
  const addToCart = (p: Product) => {
    if (p.availability === 'OUT_OF_STOCK') return;
    setCart((prev) => [...prev, p]);
  };
  const removeFromCart = (product: Product) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === product.id);
      if (index === -1) {
        return prev;
      }

      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };
  const total = cartEntries.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const cartItemsForWhatsApp = Object.values(
    cart.reduce<Record<number, { name: string; quantity: number }>>((acc, item) => {
      const current = acc[item.id];
      if (current) {
        current.quantity += 1;
      } else {
        acc[item.id] = { name: item.name, quantity: 1 };
      }
      return acc;
    }, {}),
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Bebas+Neue&family=Russo+One&family=Oswald:wght@400;700&display=swap');
        :root {
          --gh-primary: ${ghColors.primary};
          --gh-bg: ${ghColors.bg};
          --gh-text: ${ghColors.text};
          --gh-accent: ${ghColors.accent};
        }

        .gh-root {
          min-height: 100vh;
          background: var(--gh-bg);
          color: var(--gh-text);
          font-family: 'Oswald', 'Bebas Neue', Impact, sans-serif;
          overflow-x: hidden;
        }

        /* ── Marquee ── */
        .gh-marquee-wrap {
          background: var(--gh-primary);
          overflow: hidden;
          padding: 0.5rem 0;
          white-space: nowrap;
        }
        .gh-marquee-inner {
          display: inline-block;
          animation: ghMarquee 18s linear infinite;
          font-size: 0.8rem;
          letter-spacing: 3px;
          font-weight: 700;
          color: #000;
          text-transform: uppercase;
        }
        @keyframes ghMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── Header ── */
        .gh-header {
          background: color-mix(in srgb, var(--gh-bg) 80%, #000);
          border-bottom: 3px solid var(--gh-primary);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .gh-logo {
          font-family: 'Bebas Neue', Impact, sans-serif;
          font-size: 2.2rem;
          letter-spacing: 4px;
          color: var(--gh-text);
          text-shadow: 3px 3px 0 var(--gh-primary), 6px 6px 0 color-mix(in srgb, var(--gh-primary) 30%, transparent);
          line-height: 1;
        }
        .gh-logo span { color: var(--gh-primary); }
        .gh-cart-btn {
          background: var(--gh-primary);
          border: none;
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 2px;
          padding: 0.5rem 1.5rem;
          cursor: pointer;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
          transition: background 0.2s, transform 0.15s;
        }
        .gh-cart-btn:hover { background: var(--gh-accent); color: var(--gh-bg); transform: scale(1.05); }

        /* ── Hero ── */
        .gh-hero {
          background: color-mix(in srgb, var(--gh-bg) 80%, #000);
          padding: 4rem 2rem 3rem;
          position: relative;
          overflow: hidden;
          border-bottom: 2px solid #1e1e1e;
        }
        .gh-hero-bg-text {
          position: absolute;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(80px, 18vw, 200px);
          color: rgba(255,45,85,0.04);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: 20px;
          user-select: none;
        }
        .gh-hero-tag {
          display: inline-block;
          background: var(--gh-primary);
          color: var(--gh-bg);
          font-size: 0.7rem;
          letter-spacing: 3px;
          padding: 0.3rem 0.9rem;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 6px 100%);
        }
        .gh-hero h1 {
          font-family: 'Bebas Neue', Impact, sans-serif;
          font-size: clamp(3rem, 10vw, 7rem);
          letter-spacing: 6px;
          line-height: 0.9;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          color: #fff;
        }
        .gh-hero h1 .line2 {
          display: block;
          -webkit-text-stroke: 2px var(--gh-primary);
          color: transparent;
        }
        .gh-hero h1 .line3 {
          display: block;
          color: var(--gh-accent);
          font-size: 0.55em;
          letter-spacing: 12px;
        }
        .gh-hero-sub {
          font-family: 'Oswald', sans-serif;
          font-size: 0.9rem;
          color: #888;
          font-weight: 400;
          letter-spacing: 1px;
          max-width: 500px;
          line-height: 1.6;
          text-transform: none;
        }

        /* ── Toolbar ── */
        .gh-toolbar {
          background: #161616;
          border-bottom: 1px solid #2a2a2a;
          padding: 1rem 2rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .gh-search {
          flex: 1;
          min-width: 200px;
          background: #1e1e1e;
          border: 2px solid #2a2a2a;
          border-radius: 0;
          color: #f0f0f0;
          padding: 0.6rem 1rem;
          font-family: 'Oswald', sans-serif;
          font-size: 0.9rem;
          outline: none;
          letter-spacing: 1px;
          transition: border-color 0.2s;
        }
        .gh-search:focus { border-color: var(--gh-primary); }
        .gh-search::placeholder { color: #444; }
        .gh-filters {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .gh-filter-btn {
          background: transparent;
          border: 2px solid #2a2a2a;
          color: #555;
          padding: 0.45rem 1rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.9rem;
          letter-spacing: 2px;
          cursor: pointer;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .gh-filter-btn:hover { border-color: var(--gh-primary); color: var(--gh-primary); }
        .gh-filter-btn.active { border-color: var(--gh-primary); color: var(--gh-bg); background: var(--gh-primary); }

        /* ── Grid ── */
        .gh-content { padding: 2rem; }
        .gh-count-bar {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.2rem;
          letter-spacing: 4px;
          color: #444;
          margin-bottom: 1.5rem;
        }
        .gh-count-bar span { color: #ff2d55; }
        .gh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        /* ── Card ── */
        .gh-card {
          background: #141414;
          border: 1px solid #222;
          position: relative;
          transition: transform 0.25s, box-shadow 0.25s;
          cursor: pointer;
        }
        .gh-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 6px 6px 0 var(--gh-primary);
        }
        .gh-card-tape {
          position: absolute;
          top: -8px; left: 20px;
          width: 60px; height: 18px;
          background: rgba(255,214,10,0.85);
          transform: rotate(-1deg);
          z-index: 2;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .gh-card-inner { padding: 2rem 1.5rem 1.5rem; }
        .gh-card-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .gh-cat-tag {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 2px;
          color: #555;
          text-transform: lowercase;
        }
        .gh-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 2px;
          color: #000;
          padding: 0.15rem 0.6rem;
          clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
        }
        .gh-card-title {
          font-family: 'Bebas Neue', Impact, sans-serif;
          font-size: 1.6rem;
          letter-spacing: 2px;
          color: #f0f0f0;
          margin-bottom: 0.75rem;
          line-height: 1;
          text-transform: uppercase;
        }
        .gh-card-desc {
          font-family: 'Oswald', sans-serif;
          font-size: 0.8rem;
          color: #666;
          line-height: 1.6;
          font-weight: 400;
          text-transform: none;
          margin-bottom: 1rem;
        }
        .gh-card-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.72rem;
          color: #444;
          font-family: 'Oswald', sans-serif;
          letter-spacing: 1px;
          margin-bottom: 1.25rem;
        }
        .gh-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #222;
          padding-top: 1rem;
        }
        .gh-price {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          color: var(--gh-accent);
          letter-spacing: 2px;
          line-height: 1;
        }
        .gh-btn {
          background: var(--gh-primary);
          border: none;
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.95rem;
          letter-spacing: 2px;
          padding: 0.55rem 1.4rem;
          cursor: pointer;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .gh-btn:hover { background: var(--gh-accent); color: var(--gh-bg); transform: scale(1.05); }
        .gh-btn-small {
          width: 2.25rem;
          padding: 0.45rem 0;
          font-size: 1rem;
        }
        .gh-qty-controls {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
        }
        .gh-qty-value {
          min-width: 1.5rem;
          text-align: center;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 1px;
          color: var(--gh-text);
        }

        /* ── Cart Drawer ── */
        .gh-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 200;
        }
        .gh-drawer {
          position: fixed;
          right: 0; top: 0; bottom: 0;
          width: 360px;
          background: color-mix(in srgb, var(--gh-bg) 80%, #000);
          border-left: 3px solid var(--gh-primary);
          padding: 2rem;
          overflow-y: auto;
          animation: ghSlide 0.3s ease;
        }
        @keyframes ghSlide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .gh-drawer-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          letter-spacing: 4px;
          color: #fff;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gh-drawer-close {
          background: none; border: none;
          color: var(--gh-primary); font-size: 1.5rem;
          cursor: pointer; font-family: inherit;
        }
        .gh-cart-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #222;
          padding: 0.85rem 0;
          font-family: 'Oswald', sans-serif;
          font-size: 0.85rem;
        }
        .gh-cart-item-name { color: #ccc; }
        .gh-cart-item-price { color: var(--gh-accent); font-weight: 700; }
        .gh-total-row {
          display: flex;
          justify-content: space-between;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem;
          letter-spacing: 2px;
          padding: 1rem 0;
          color: #fff;
        }
        .gh-checkout-btn {
          width: 100%;
          background: var(--gh-primary);
          border: none;
          color: #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.3rem;
          letter-spacing: 3px;
          padding: 1rem;
          cursor: pointer;
          clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
          transition: background 0.2s;
          margin-top: 0.5rem;
        }
        .gh-checkout-btn:hover { background: var(--gh-accent); color: var(--gh-bg); }

        /* ── Empty ── */
        .gh-empty {
          text-align: center;
          padding: 5rem 2rem;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          letter-spacing: 6px;
          color: #222;
        }

        /* ── Bottom strip ── */
        .gh-bottom-strip {
          background: var(--gh-primary);
          text-align: center;
          padding: 1rem;
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 4px;
          font-size: 1rem;
          color: var(--gh-bg);
          margin-top: 3rem;
        }
      `}</style>

      <div className="gh-root">
        {/* Marquee */}
        <div className="gh-marquee-wrap">
          <div className="gh-marquee-inner">
            {'🔥 NUEVO DROP 🔥 TOOLS ON SALE 💻 COP IT BEFORE IT GONE 🛒 GHETTO DEV LIFE 💀 CODE HARD SHIP HARDER 🚀 NEW ARRIVALS 🔥 NUEVO DROP 🔥 TOOLS ON SALE 💻 COP IT BEFORE IT GONE 🛒 GHETTO DEV LIFE 💀 CODE HARD SHIP HARDER 🚀 NEW ARRIVALS 🔥 '.repeat(2)}
          </div>
        </div>

        {/* Header */}
        <header className="gh-header">
          <div className="gh-logo">
            {displayHeader ? (
              <>{displayHeader}<span></span></>
            ) : (
              <><span>store</span></>
            )}
          </div>
          <button className="gh-cart-btn" onClick={() => setCartOpen(true)}>
            🛒 BAG [{cartItemCount}]
          </button>
        </header>

        {/* Hero */}
        <section className="gh-hero">
          <div className="gh-hero-bg-text">{shopName}</div>
          <div className="gh-hero-tag">🔥 Exclusive Drop</div>
          {showCustomHero ? (
            <>
              <h1>
                <span style={{ fontSize: 'clamp(2rem,6vw,3.25rem)', display: 'block' }}>
                  {readHeroTitle(themeConfig, shopName)}
                </span>
              </h1>
              <p className="gh-hero-sub">
                {readHeroSubtitle(
                  themeConfig,
                  'No cap. Tu catálogo en vivo. Toda la selección disponible ahora.',
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                CODE<span className="line2">DIFFERENT</span>
                <span className="line3">FOR REAL ONES ONLY</span>
              </h1>
              <p className="gh-hero-sub">
                No cap. These tools hit different. Built by devs who been through the struggle. Real tools, real results, no corporate BS.
              </p>
            </>
          )}
        </section>

        {/* Toolbar */}
        <div className="gh-toolbar">
          <input
            className="gh-search"
            type="text"
            placeholder="🔍  SEARCH THE DROP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Products */}
        <div className="gh-content">
          <div className="gh-count-bar">
            <span>{filtered.length}</span> TOOLS IN THE DROP
          </div>
          {!hasProducts ? (
            <div className="gh-empty">{EMPTY_PRODUCTS_MESSAGE}</div>
          ) : filtered.length === 0 ? (
            <div className="gh-empty">NADA. TRY AGAIN.</div>
          ) : (
            <div className="gh-grid">
              {filtered.map((p) => (
                <GhettoProductCard
                  key={p.id}
                  product={p}
                  quantity={cartSummary[p.id]?.quantity ?? 0}
                  onIncrease={addToCart}
                  onDecrease={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cart Drawer */}
        {cartOpen && (
          <div className="gh-overlay" onClick={() => setCartOpen(false)}>
            <div className="gh-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="gh-drawer-title">
                <span>DA BAG</span>
                <button className="gh-drawer-close" onClick={() => setCartOpen(false)}>✕</button>
              </div>
              {cart.length === 0 ? (
                <p style={{ color: '#444', fontFamily: 'Oswald, sans-serif', fontSize: '0.9rem' }}>
                  Bag empty. Go cop something.
                </p>
              ) : (
                <>
                  {cartEntries.map((entry) => (
                    <div key={entry.product.id} className="gh-cart-item">
                      <span className="gh-cart-item-name">{entry.quantity}x {entry.product.name}</span>
                      <span className="gh-cart-item-price">${(entry.product.price * entry.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="gh-total-row">
                    <span>TOTAL</span>
                    <span style={{ color: '#00f5d4' }}>${total.toFixed(2)}</span>
                  </div>
                  <WhatsAppButton
                    variant="inline"
                    shopId={shopId}
                    shopName={shopName}
                    themeColors={ghColors}
                    cartItems={cartItemsForWhatsApp}
                    label="WhatsApp"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="gh-bottom-strip">
          💀 {(shopName || displayHeader || 'STORE').toUpperCase()} · BUILT WITH OPEN STORE · 2026 💀
        </div>
      </div>
    </>
  );
}
