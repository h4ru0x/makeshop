import { useState } from 'react';
import WhatsAppButton from './WhatsAppButton';
import type { Product } from './DevStyle';
import type { ThemeViewProps } from '../storefront/themeTypes';
import { hasConfiguredHeroTitle, readHeroSubtitle, readHeroTitle } from '../storefront/themeTypes';



// ─── Product Card ─────────────────────────────────────────────────────────────
function EnterpriseProductCard({
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
  const [hovered, setHovered] = useState(false);



  return (
    <div
      className={`ent-card ${hovered ? 'ent-card--hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top line accent */}
      <div className="ent-card-accent" />

      {product.imageUrl && (
        <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2ddd5' }}>
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}


      {/* Title */}
      <h3 className="ent-card-title">{product.name}</h3>


      {/* Description */}
      <p className="ent-description">{product.description}</p>

      {/* Divider */}
      <div className="ent-divider" />

      {/* Footer */}
      <div className="ent-card-footer">
        <div className="ent-footer-left">
          <span className="ent-star-label">
          </span>
        </div>
        <div className="ent-footer-right">
          <span className="ent-price">
            {product.price === 0 ? 'Free' : `$${product.price} / mo`}
          </span>
          <div style={{ marginLeft: '0.6rem', fontSize: '0.78rem', color: product.availability === 'OUT_OF_STOCK' ? '#ff6b6b' : 'var(--ent-accent)' }}>
            {product.availability === 'OUT_OF_STOCK' ? 'Out of stock' : 'Available'}
          </div>
          <div className="ent-qty-controls">
            <button className="ent-btn ent-btn-small" onClick={() => onDecrease(product)} disabled={quantity === 0}>
              -
            </button>
            <span className="ent-qty-value">{quantity}</span>
            <button
              className="ent-btn ent-btn-small"
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
function readEntColors(themeConfig: import('../storefront/themeTypes').ShopThemeJson | null) {
  const c = themeConfig?.colors as Record<string, string> | undefined;
  return {
    primary: c?.primaryColor ?? '#0057b8',
    bg: c?.bgColor ?? '#f8f9fb',
    text: c?.textColor ?? '#1a2332',
    accent: c?.accentColor ?? '#c9a84c',
    headerName: (themeConfig?.headerName as string) ?? '',
  };
}

export default function EntrepriseStyle({ shopId, shopName, themeConfig, catalogProducts }: ThemeViewProps) {
  const [cart, setCart] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const productSource = catalogProducts ?? [];
  const showCustomHero = hasConfiguredHeroTitle(themeConfig);
  const entColors = readEntColors(themeConfig);
  const displayHeader = entColors.headerName || shopName || 'OpenStore';
  const hasProducts = productSource.length > 0;
  const EMPTY_PRODUCTS_MESSAGE = 'No products are currently available. Please check back later.';

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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        :root {
          --ent-primary: ${entColors.primary};
          --ent-bg: ${entColors.bg};
          --ent-text: ${entColors.text};
          --ent-accent: ${entColors.accent};
        }

        .ent-root {
          min-height: 100vh;
          background: var(--ent-bg);
          color: var(--ent-text);
          font-family: 'Montserrat', 'Helvetica Neue', sans-serif;
        }

        /* ── Topbar ── */
        .ent-topbar {
          background: var(--ent-text);
          color: var(--ent-accent);
          text-align: center;
          padding: 0.5rem;
          font-size: 0.72rem;
          letter-spacing: 3px;
          font-weight: 600;
          text-transform: uppercase;
        }

        /* ── Header ── */
        .ent-header {
          background: var(--ent-bg);
          border-bottom: 1px solid color-mix(in srgb, var(--ent-text) 12%, transparent);
          padding: 1.25rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .ent-logo {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--ent-text);
          letter-spacing: -0.5px;
        }
        .ent-logo em {
          color: var(--ent-accent);
          font-style: normal;
        }
        .ent-nav {
          display: flex;
          gap: 2.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .ent-nav a {
          color: color-mix(in srgb, var(--ent-text) 60%, transparent);
          text-decoration: none;
          transition: color 0.2s;
        }
        .ent-nav a:hover { color: var(--ent-accent); }
        .ent-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ent-cart-btn {
          background: var(--ent-text);
          color: var(--ent-accent);
          border: none;
          padding: 0.6rem 1.4rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .ent-cart-btn:hover {
          background: var(--ent-accent);
          color: var(--ent-text);
          transform: translateY(-1px);
        }

        /* ── Hero ── */
        .ent-hero {
          background: linear-gradient(160deg, var(--ent-text) 0%, color-mix(in srgb, var(--ent-text) 85%, var(--ent-primary)) 100%);
          color: var(--ent-bg);
          padding: 5rem 3rem 4rem;
          position: relative;
          overflow: hidden;
        }
        .ent-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .ent-hero::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c9a84c 50%, transparent);
          opacity: 0.6;
        }
        .ent-hero-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--ent-accent);
          font-weight: 600;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .ent-hero-eyebrow::before {
          content: '';
          display: block;
          width: 32px;
          height: 1px;
          background: var(--ent-accent);
        }
        .ent-hero h1 {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          max-width: 700px;
          color: #fff;
        }
        .ent-hero h1 em {
          color: var(--ent-accent);
          font-style: normal;
          border-bottom: 2px solid color-mix(in srgb, var(--ent-accent) 50%, transparent);
        }
        .ent-hero-sub {
          color: rgba(255,255,255,0.6);
          font-size: 0.95rem;
          font-weight: 400;
          max-width: 540px;
          line-height: 1.7;
          margin-bottom: 2.5rem;
        }
        .ent-hero-stats {
          display: flex;
          gap: 3rem;
        }
        .ent-stat-item { }
        .ent-stat-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--ent-accent);
          line-height: 1;
        }
        .ent-stat-label {
          font-size: 0.7rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-top: 0.25rem;
        }

        /* ── Toolbar ── */
        .ent-toolbar {
          background: #fff;
          border-bottom: 1px solid #e2ddd5;
          padding: 1.25rem 3rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .ent-search-wrap {
          position: relative;
          flex: 1;
          min-width: 240px;
        }
        .ent-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9b9b9b;
          font-size: 0.9rem;
        }
        .ent-search {
          width: 100%;
          border: 1px solid #e2ddd5;
          background: #f8f7f4;
          color: #1a1a2e;
          padding: 0.65rem 1rem 0.65rem 2.75rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.82rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          border-radius: 0;
        }
        .ent-search:focus {
          border-color: var(--ent-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--ent-accent) 15%, transparent);
        }
        .ent-search::placeholder { color: #b0a898; }

        .ent-filters {
          display: flex;
          gap: 0.25rem;
        }
        .ent-filter-btn {
          background: transparent;
          border: 1px solid #e2ddd5;
          color: #5a5a7a;
          padding: 0.5rem 1.1rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ent-filter-btn:hover { border-color: var(--ent-accent); color: var(--ent-accent); }
        .ent-filter-btn.active {
          background: var(--ent-text);
          border-color: var(--ent-text);
          color: var(--ent-accent);
        }

        /* ── Products grid ── */
        .ent-content {
          padding: 3rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .ent-section-title {
          font-size: 0.7rem;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #9b9b9b;
          font-weight: 600;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ent-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2ddd5;
        }
        .ent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5px;
          background: #e2ddd5;
        }

        /* ── Card ── */
        .ent-card {
          background: #fff;
          padding: 2rem;
          transition: box-shadow 0.3s, transform 0.3s;
          position: relative;
        }
        .ent-card--hovered {
          box-shadow: 0 12px 40px rgba(26,26,46,0.12);
          transform: translateY(-3px);
          z-index: 1;
        }
        .ent-card-accent {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--ent-text), var(--ent-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .ent-card--hovered .ent-card-accent { transform: scaleX(1); }

        .ent-category-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .ent-category {
          font-size: 0.65rem;
          letter-spacing: 2px;
          font-weight: 700;
          color: #9b9b9b;
        }
        .ent-badge {
          font-size: 0.6rem;
          letter-spacing: 1px;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          text-transform: uppercase;
        }

        .ent-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .ent-version-line {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.72rem;
          color: #b0a898;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .ent-description {
          font-size: 0.83rem;
          color: #5a5a7a;
          line-height: 1.7;
          font-weight: 400;
        }
        .ent-divider {
          height: 1px;
          background: #e2ddd5;
          margin: 1.25rem 0;
        }
        .ent-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .ent-footer-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ent-star-label {
          font-size: 0.72rem;
          color: #9b9b9b;
          font-weight: 500;
        }
        .ent-footer-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .ent-price {
          font-size: 1rem;
          font-weight: 800;
          color: #1a1a2e;
          letter-spacing: -0.5px;
        }
        .ent-btn {
          background: var(--ent-text);
          color: var(--ent-accent);
          border: none;
          padding: 0.6rem 1.5rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ent-btn:hover {
          background: var(--ent-accent);
          color: var(--ent-text);
        }
        .ent-btn-small {
          width: 2.35rem;
          padding: 0.6rem 0;
          text-align: center;
        }
        .ent-qty-controls {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ent-qty-value {
          min-width: 1.5rem;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 700;
          color: #1a1a2e;
        }

        /* ── Cart Drawer ── */
        .ent-cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          animation: entFadeIn 0.2s ease;
        }
        .ent-cart-drawer {
          position: fixed;
          right: 0; top: 0; bottom: 0;
          width: 380px;
          background: #fff;
          box-shadow: -4px 0 30px rgba(0,0,0,0.15);
          padding: 2rem;
          overflow-y: auto;
          animation: entSlideIn 0.3s ease;
        }
        @keyframes entSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes entFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ent-drawer-title {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #1a1a2e;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #1a1a2e;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ent-drawer-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #5a5a7a;
        }
        .ent-cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 0;
          border-bottom: 1px solid #e2ddd5;
          font-size: 0.83rem;
        }
        .ent-cart-item-name { font-weight: 600; color: #1a1a2e; }
        .ent-cart-item-price { color: #c9a84c; font-weight: 700; }
        .ent-cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0 1rem;
          font-weight: 700;
          font-size: 1.05rem;
        }
        .ent-checkout-btn {
          width: 100%;
          background: var(--ent-text);
          color: var(--ent-accent);
          border: none;
          padding: 1rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }
        .ent-checkout-btn:hover { background: var(--ent-accent); color: var(--ent-text); }

        /* ── Empty ── */
        .ent-empty {
          text-align: center;
          padding: 5rem 2rem;
          color: #b0a898;
        }
        .ent-empty h3 {
          font-size: 1.2rem;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        /* ── Footer ── */
        .ent-footer {
          background: var(--ent-text);
          color: color-mix(in srgb, var(--ent-bg) 40%, transparent);
          text-align: center;
          padding: 2rem 3rem;
          font-size: 0.72rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 4rem;
        }
        .ent-footer span { color: var(--ent-accent); }
      `}</style>

      <div className="ent-root">
        {/* Announcement bar */}
        <div className="ent-topbar">
          Enterprise Licensing Available — Volume Discounts up to 40% · Contact Sales
        </div>

        {/* Header */}
        <header className="ent-header">
          <div className="ent-logo">
            {displayHeader}<em>{' '}</em>
          </div>
          <nav className="ent-nav">
            <a href="#">Products</a>
            <a href="#">Solutions</a>
            <a href="#">Pricing</a>
            <a href="#">Contact</a>
          </nav>
          <div className="ent-header-right">
            <button className="ent-cart-btn" onClick={() => setCartOpen(true)}>
              Cart ({cartItemCount})
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="ent-hero">
          <div className="ent-hero-eyebrow">Developer Solutions Catalog</div>
          {showCustomHero ? (
            <>
              <h1>{readHeroTitle(themeConfig, shopName)}</h1>
              <p className="ent-hero-sub">
                {readHeroSubtitle(
                  themeConfig,
                  'Tu catálogo, con disponibilidad y precios desde OpenStore.',
                )}
              </p>
            </>
          ) : (
            <>
              <h1>
                Enterprise-Grade<br />
                Tools for <em>Modern Teams</em>
              </h1>
              <p className="ent-hero-sub">
                Scalable, secure, and supported software solutions built for professional engineering organizations.
                SOC 2 compliant. 24/7 support.
              </p>
            </>
          )}
          <div className="ent-hero-stats">
            <div className="ent-stat-item">
              <div className="ent-stat-num">6</div>
              <div className="ent-stat-label">Products</div>
            </div>
            <div className="ent-stat-item">
              <div className="ent-stat-num">99.9%</div>
              <div className="ent-stat-label">Uptime SLA</div>
            </div>
            <div className="ent-stat-item">
              <div className="ent-stat-num">80k+</div>
              <div className="ent-stat-label">Installs</div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="ent-toolbar">
          <div className="ent-search-wrap">
            <span className="ent-search-icon">🔍</span>
            <input
              className="ent-search"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Products */}
        <div className="ent-content">
          <div className="ent-section-title">
            {filtered.length} solution{filtered.length !== 1 ? 's' : ''} available
          </div>

          {!hasProducts ? (
            <div className="ent-empty">
              <h3>{EMPTY_PRODUCTS_MESSAGE}</h3>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ent-empty">
              <h3>No products match your criteria.</h3>
              <p>Try adjusting your search.</p>
            </div>
          ) : (
            <div className="ent-grid">
              {filtered.map((p) => (
                <EnterpriseProductCard
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
          <div className="ent-cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="ent-cart-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="ent-drawer-title">
                <span>Your Plan ({cartItemCount})</span>
                <button className="ent-drawer-close" onClick={() => setCartOpen(false)}>✕</button>
              </div>
              {cart.length === 0 ? (
                <p style={{ color: '#b0a898', fontSize: '0.85rem' }}>No items added yet.</p>
              ) : (
                <>
                  {cartEntries.map((entry) => (
                    <div key={entry.product.id} className="ent-cart-item">
                      <span className="ent-cart-item-name">{entry.quantity}x {entry.product.name}</span>
                      <span className="ent-cart-item-price">${(entry.product.price * entry.quantity).toFixed(2)}/mo</span>
                    </div>
                  ))}
                  <div className="ent-cart-total-row">
                    <span>Total Monthly</span>
                    <span style={{ color: '#c9a84c' }}>${total.toFixed(2)}/mo</span>
                  </div>
                  <WhatsAppButton
                    variant="inline"
                    shopId={shopId}
                    shopName={shopName}
                    themeColors={entColors}
                    cartItems={cartItemsForWhatsApp}
                    label="WhatsApp"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="ent-footer">
          © 2026 <span>{shopName || displayHeader}</span> · Built with OpenStore
        </footer>
      </div>
    </>
  );
}
