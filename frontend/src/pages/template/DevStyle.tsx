import { useState } from 'react';
import WhatsAppButton from './WhatsAppButton';
import type { ThemeViewProps } from '../storefront/themeTypes';
import { hasConfiguredHeroTitle, readHeroSubtitle, readHeroTitle } from '../storefront/themeTypes';

// ─── Shared Product Data ──────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  badge?: string;
  availability?: string;
  imageUrl?: string;
}



// ─── Product Card ─────────────────────────────────────────────────────────────
function DevProductCard({
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
    HOT: '#ff5f57',
    NEW: '#39ff14',
    SALE: '#ffd60a',
    FREE: '#0af0ff',
  };

  return (
    <div className="dev-card">
      {product.imageUrl && (
        <div style={{ marginBottom: '1rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid color-mix(in srgb, var(--dev-primary) 18%, transparent)' }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <div className="dev-card-header">
        <span className="dev-prompt">$&gt;</span>
        <span className="dev-pkg-name">{product.name.toLowerCase().replace(/\s+/g, '-')}</span>
        {product.badge && (
          <span
            className="dev-badge"
            style={{ color: badgeColors[product.badge] ?? '#fff', borderColor: badgeColors[product.badge] ?? '#fff' }}
          >
            [{product.badge}]
          </span>
        )}
      </div>



      <p className="dev-description">// {product.description}</p>
      <div style={{ marginBottom: '0.5rem' }}>
        <span
          className={"dev-availability " + (product.availability === 'OUT_OF_STOCK' ? 'dev-out' : 'dev-in')}
          aria-hidden
        >
          {product.availability === 'OUT_OF_STOCK' ? 'Out of stock' : 'Available'}
        </span>
      </div>

      <div className="dev-card-footer">
            <div className="dev-actions">
          <span className="dev-price">${product.price}.00</span>
          <div className="dev-qty-controls">
            <button className="dev-btn dev-btn-small" onClick={() => onDecrease(product)} disabled={quantity === 0}>
              -
            </button>
            <span className="dev-qty-value">{quantity}</span>
                <button
                  className="dev-btn dev-btn-small"
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

// ─── Main Page ──────────────────────────────────────────────────────────────────────────────────
function readColors(themeConfig: import('../storefront/themeTypes').ShopThemeJson | null) {
  const c = themeConfig?.colors as Record<string, string> | undefined;
  return {
    primary: c?.primaryColor ?? '#39ff14',
    bg: c?.bgColor ?? '#0d1117',
    text: c?.textColor ?? '#c9d1d9',
    accent: c?.accentColor ?? '#58a6ff',
    headerName: (themeConfig?.headerName as string) ?? '',
  };
}

export default function DevStyle({ shopId, shopName, themeConfig, catalogProducts, hasActiveSession }: ThemeViewProps) {
  const [cart, setCart] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const productSource = catalogProducts ?? [];
  const showCustomHero = hasConfiguredHeroTitle(themeConfig);
  const colors = readColors(themeConfig);
  const displayHeader = colors.headerName || shopName || 'openStore.dev';
  const hasProducts = productSource.length > 0;
  const EMPTY_PRODUCTS_MESSAGE = 'Your query returned 0 products. Try again later.';

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
  const cartTotal = cartEntries.reduce((total, entry) => total + entry.product.price * entry.quantity, 0);
  const cartItemsForWhatsApp = cartEntries.map((entry) => ({
    name: entry.product.name,
    quantity: entry.quantity,
  }));

  const filtered = productSource.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.availability === 'OUT_OF_STOCK') return;
    setCart((prev) => [...prev, product]);
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        :root {
          --dev-primary: ${colors.primary};
          --dev-bg: ${colors.bg};
          --dev-text: ${colors.text};
          --dev-accent: ${colors.accent};
        }

        .dev-root {
          min-height: 100vh;
          background: var(--dev-bg);
          color: var(--dev-text);
          font-family: 'Source Code Pro', 'Fira Code', monospace;
          padding: 0;
        }

        /* ── Header ── */
        .dev-header {
          background: color-mix(in srgb, var(--dev-bg) 85%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .dev-logo {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--dev-primary);
          letter-spacing: -0.5px;
        }
        .dev-logo span { color: var(--dev-accent); }
        .dev-header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .dev-cart-pill {
          background: color-mix(in srgb, var(--dev-bg) 70%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 30%, transparent);
          color: var(--dev-accent);
          padding: 0.4rem 1rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .dev-cart-pill:hover { border-color: var(--dev-primary); color: var(--dev-primary); }
        .dev-cart-pill-summary {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .dev-cart-pill-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.4rem;
          height: 1.4rem;
          padding: 0 0.35rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--dev-primary) 18%, transparent);
          color: var(--dev-primary);
          font-size: 0.72rem;
          font-weight: 700;
        }

        /* ── Hero ── */
        .dev-hero {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          padding: 3rem 2rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .dev-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--dev-primary) 6%, transparent) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--dev-accent) 7%, transparent) 0%, transparent 50%);
          pointer-events: none;
        }
        .dev-hero-label {
          color: var(--dev-primary);
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .dev-hero h1 {
          font-size: clamp(1.6rem, 4vw, 2.8rem);
          font-weight: 700;
          color: var(--dev-text);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .dev-hero h1 .accent { color: var(--dev-primary); }
        .dev-hero h1 .accent2 { color: var(--dev-accent); }
        .dev-hero-sub {
          color: color-mix(in srgb, var(--dev-text) 60%, transparent);
          font-size: 0.9rem;
          margin-bottom: 0;
          font-style: italic;
        }
        .dev-scan-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--dev-primary), transparent);
          margin-top: 2rem;
          opacity: 0.4;
          animation: devScan 3s ease-in-out infinite;
        }
        @keyframes devScan {
          0%, 100% { opacity: 0.1; transform: scaleX(0.3); }
          50% { opacity: 0.6; transform: scaleX(1); }
        }

        /* ── Search & Filter bar ── */
        .dev-toolbar {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dev-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 220px;
        }
        .dev-search-prefix {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          color: #39ff14;
          font-size: 0.85rem;
          pointer-events: none;
        }
        .dev-search {
          width: 100%;
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 20%, transparent);
          color: var(--dev-text);
          padding: 0.55rem 0.75rem 0.55rem 6.5rem;
          border-radius: 4px;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .dev-search:focus { border-color: var(--dev-primary); }
        .dev-search::placeholder { color: color-mix(in srgb, var(--dev-text) 30%, transparent); }
        .dev-search-prefix { color: var(--dev-primary); }

        .dev-filter-group {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .dev-filter-btn {
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          color: color-mix(in srgb, var(--dev-text) 60%, transparent);
          padding: 0.4rem 0.9rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          text-transform: lowercase;
        }
        .dev-filter-btn:hover { border-color: var(--dev-accent); color: var(--dev-accent); }
        .dev-filter-btn.active { border-color: var(--dev-primary); color: var(--dev-primary); background: color-mix(in srgb, var(--dev-primary) 7%, transparent); }

        /* ── Grid ── */
        .dev-main {
          min-height: calc(100vh - 200px);
        }

        .dev-products-area {
          padding: 2rem;
        }

        .dev-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }

        /* ── Card ── */
        .dev-card {
          background: color-mix(in srgb, var(--dev-bg) 90%, #000);
          border: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          border-radius: 6px;
          padding: 1.25rem;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .dev-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--dev-primary), var(--dev-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s;
        }
        .dev-card:hover {
          border-color: var(--dev-primary);
          box-shadow: 0 0 20px color-mix(in srgb, var(--dev-primary) 12%, transparent);
          transform: translateY(-2px);
        }
        .dev-card:hover::before { transform: scaleX(1); }

        .dev-card-header {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .dev-prompt { color: var(--dev-primary); font-size: 0.85rem; flex-shrink: 0; }
        .dev-pkg-name {
          color: var(--dev-accent);
          font-size: 0.95rem;
          font-weight: 700;
          flex: 1;
          word-break: break-all;
        }
        .dev-badge {
          font-size: 0.65rem;
          font-weight: 700;
          border: 1px solid;
          padding: 0 0.4rem;
          border-radius: 2px;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .dev-card-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
          font-size: 0.72rem;
          color: #484f58;
        }
        .dev-meta-item em { color: #8b949e; font-style: normal; }

        .dev-availability {
          font-size: 0.78rem;
          color: #9da6b3;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: color-mix(in srgb, var(--dev-bg) 92%, transparent);
          display: inline-block;
        }
        .dev-availability.dev-out { color: #ff6b6b; }
        .dev-availability.dev-in { color: var(--dev-primary); }

        .dev-description {
          font-size: 0.8rem;
          color: #6e7681;
          line-height: 1.6;
          margin-bottom: 1rem;
          font-style: italic;
        }

        .dev-card-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .dev-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .dev-price {
          color: color-mix(in srgb, var(--dev-primary) 80%, #ff0);
          font-weight: 700;
          font-size: 1.05rem;
        }
        .dev-btn {
          background: color-mix(in srgb, var(--dev-bg) 60%, #000);
          border: 1px solid var(--dev-primary);
          color: var(--dev-primary);
          padding: 0.45rem 1rem;
          border-radius: 4px;
          font-size: 0.78rem;
          font-family: 'Source Code Pro', monospace;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dev-btn-small {
          padding: 0.35rem 0.7rem;
          min-width: 2rem;
        }
        .dev-btn:hover {
          background: color-mix(in srgb, var(--dev-primary) 12%, transparent);
          box-shadow: 0 0 10px color-mix(in srgb, var(--dev-primary) 30%, transparent);
        }
        .dev-btn:active { transform: scale(0.97); }
        .dev-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }
        .dev-qty-controls {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }
        .dev-qty-value {
          min-width: 1.5rem;
          text-align: center;
          color: var(--dev-text);
          font-weight: 700;
        }

        /* ── Cart Drawer ── */
        .dev-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 180;
          animation: devOverlayIn 0.2s ease;
        }
        .dev-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(420px, 92vw);
          background: color-mix(in srgb, var(--dev-bg) 94%, #000);
          border-left: 1px solid color-mix(in srgb, var(--dev-primary) 22%, transparent);
          box-shadow: -16px 0 40px rgba(0, 0, 0, 0.35);
          z-index: 190;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          animation: devDrawerIn 0.25s ease;
        }
        @keyframes devOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes devDrawerIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .dev-drawer-head {
          padding: 1.25rem 1.25rem 1rem;
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
        }
        .dev-drawer-kicker {
          color: var(--dev-primary);
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .dev-drawer-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          font-size: 1rem;
          font-weight: 700;
          color: var(--dev-text);
        }
        .dev-drawer-close {
          background: transparent;
          border: 1px solid color-mix(in srgb, var(--dev-primary) 25%, transparent);
          color: var(--dev-primary);
          width: 2rem;
          height: 2rem;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        .dev-drawer-body {
          flex: 1;
          padding: 1rem 1.25rem 0;
          overflow-y: auto;
        }
        .dev-drawer-empty {
          padding: 1.5rem 0;
          color: color-mix(in srgb, var(--dev-text) 55%, transparent);
          font-size: 0.82rem;
          line-height: 1.6;
        }
        .dev-drawer-item {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.95rem 0;
          border-bottom: 1px solid color-mix(in srgb, var(--dev-primary) 10%, transparent);
          font-size: 0.78rem;
        }
        .dev-drawer-command {
          color: var(--dev-primary);
          font-family: 'Source Code Pro', monospace;
          word-break: break-word;
        }
        .dev-drawer-meta {
          color: color-mix(in srgb, var(--dev-text) 55%, transparent);
          text-align: right;
          flex-shrink: 0;
        }
        .dev-drawer-foot {
          padding: 1rem 1.25rem 1.25rem;
          border-top: 1px solid color-mix(in srgb, var(--dev-primary) 15%, transparent);
          display: grid;
          gap: 0.9rem;
        }
        .dev-drawer-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          color: var(--dev-text);
          font-size: 0.82rem;
        }
        .dev-drawer-total strong {
          color: var(--dev-primary);
          font-size: 1.05rem;
        }
        .dev-checkout-command {
          color: color-mix(in srgb, var(--dev-text) 60%, transparent);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: lowercase;
        }

        /* ── Empty ── */
        .dev-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: #484f58;
          font-size: 0.85rem;
        }
        .dev-empty-code {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          color: #21262d;
        }

      `}</style>

      <div className="dev-root">
        {/* Header */}
        <header className="dev-header">
          <div className="dev-logo">
            {displayHeader.includes(' ') ? (
              <>{displayHeader.split(' ')[0]}<span>{displayHeader.split(' ').slice(1).join(' ')}</span></>
            ) : (
              <>{displayHeader}<span>.dev</span></>
            )}
          </div>
          <div className="dev-header-right">
            {shopName && (
              <span style={{ color: '#484f58', fontSize: '0.75rem' }}>
                {shopName}
              </span>
            )}
            <button className="dev-cart-pill" onClick={() => setCartOpen(true)}>
              <span className="dev-cart-pill-summary">
                📦 cart <span className="dev-cart-pill-badge">{cartItemCount}</span> ${cartTotal.toFixed(2)}
              </span>
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="dev-hero">
          <div className="dev-hero-label">// marketplace for developers</div>
          {showCustomHero ? (
            <>
              <h1>{readHeroTitle(themeConfig, shopName)}</h1>
              <p className="dev-hero-sub">
                {readHeroSubtitle(
                  themeConfig,
                  '> Catálogo de la tienda. Productos cargados desde el backend.',
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                <span className="accent">pkg</span> install{' '}
                <span className="accent2">--save</span> your-next-tool
              </h1>
              <p className="dev-hero-sub">
                {'>'} 6 battle-tested packages for serious engineers. No fluff. Just code.
              </p>
            </>
          )}
          <div className="dev-scan-line" />
        </section>

        {/* Toolbar */}
        <div className="dev-toolbar">
          <div className="dev-search-wrapper">
            <span className="dev-search-prefix">$ search</span>
            <input
              className="dev-search"
              type="text"
              placeholder="grep -i 'package-name'"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Main */}
        <div className="dev-main">
          <div className="dev-products-area">
            {!hasProducts ? (
              <div className="dev-empty" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#8b949e' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--dev-text)' }}>{EMPTY_PRODUCTS_MESSAGE}</h3>
              </div>
            ) : filtered.length === 0 ? (
              <div className="dev-empty">
                <div className="dev-empty-code">404</div>
                <div>No packages match your query.</div>
                <div style={{ marginTop: '0.5rem', color: '#30363d' }}>
                  try: `grep -ri 'something else'`
                </div>
              </div>
            ) : (
              <div className="dev-grid">
                {filtered.map((p) => (
                  <DevProductCard
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
        </div>

        {cartOpen && (
          <>
            <div className="dev-overlay" onClick={() => setCartOpen(false)} />
            <aside
              className="dev-drawer"
              aria-label="Cart drawer"
              style={{
                bottom: hasActiveSession ? 0 : '5.5rem',
                paddingBottom: hasActiveSession ? 0 : '5.5rem',
              }}
            >
              <div className="dev-drawer-head">
                <div className="dev-drawer-kicker">// npm install queue</div>
                <div className="dev-drawer-title">
                  <span>shopping cart [{cartItemCount}]</span>
                  <button className="dev-drawer-close" onClick={() => setCartOpen(false)}>
                    ✕
                  </button>
                </div>
              </div>
              <div className="dev-drawer-body">
                {cartEntries.length === 0 ? (
                  <div className="dev-drawer-empty">
                    <div>$ npm install</div>
                    <div>cart is empty. add a package to build your stack.</div>
                  </div>
                ) : (
                  cartEntries.map((entry) => {
                    const slug = entry.product.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div key={entry.product.id} className="dev-drawer-item">
                        <div className="dev-drawer-command">
                          $ npm install {slug}
                        </div>
                        <div className="dev-drawer-meta">
                          <div>{entry.quantity}x</div>
                          <div>${(entry.product.price * entry.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="dev-drawer-foot">
                <div className="dev-drawer-total">
                  <span>build total</span>
                  <strong>${cartTotal.toFixed(2)}</strong>
                </div>
                <div className="dev-checkout-command">$ npm run checkout --whatsapp</div>
                <WhatsAppButton
                  variant="inline"
                  shopId={shopId}
                  shopName={shopName}
                  themeColors={colors}
                  cartItems={cartItemsForWhatsApp}
                  label="WhatsApp"
                />
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}
