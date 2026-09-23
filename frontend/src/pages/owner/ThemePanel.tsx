import { useEffect, useState } from 'react';
import { Palette, Save, Check, X } from 'lucide-react';
import {
  getShopPublicTheme,
  updateShopTheme,
} from '../../api/shop-service/shop-api';
import type { ThemeConfig, ThemeColors } from '../../api/shop-service/shop-api';

/* ── Theme catalogue ───────────────────────────────────────────────────── */
interface ThemeMeta {
  key: string;
  label: string;
  description: string;
  defaultColors: ThemeColors;
  preview: React.ReactNode;
}

const DEV_PREVIEW = (
  <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#39ff14', background: '#0d1117', borderRadius: 6, padding: '0.6rem 0.8rem', lineHeight: 1.8 }}>
    <div style={{ color: '#8b949e' }}>$ npm install --save</div>
    <div>▉▉▉▉░ <span style={{ color: '#58a6ff' }}>package</span> v1.0</div>
    <div style={{ color: '#ffd60a' }}>$49.00</div>
  </div>
);

const ENTERPRISE_PREVIEW = (
  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', background: '#f8f9fb', borderRadius: 6, padding: '0.6rem 0.8rem', lineHeight: 1.8, color: '#1a2332' }}>
    <div style={{ fontWeight: 700, color: '#0057b8', fontSize: '0.7rem' }}>ENTERPRISE</div>
    <div style={{ color: '#4b5563' }}>Premium solution</div>
    <div style={{ fontWeight: 700 }}>$299.00</div>
  </div>
);

const GHETTO_PREVIEW = (
  <div style={{ fontFamily: 'Impact, sans-serif', fontSize: '0.65rem', background: '#111', borderRadius: 6, padding: '0.6rem 0.8rem', lineHeight: 1.8, color: '#fff' }}>
    <div style={{ color: '#ff3b3b', fontWeight: 900, letterSpacing: 2 }}>🔥 HOT DROP</div>
    <div style={{ color: '#ffcc00' }}>Exclusive item</div>
    <div style={{ fontWeight: 900, color: '#fff' }}>$99</div>
  </div>
);

const THEMES: ThemeMeta[] = [
  {
    key: 'dev',
    label: 'Dev',
    description: 'Terminal / hacker aesthetic. Monospace fonts, green-on-dark.',
    defaultColors: { primaryColor: '#39ff14', bgColor: '#0d1117', textColor: '#c9d1d9', accentColor: '#58a6ff' },
    preview: DEV_PREVIEW,
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    description: 'Corporate & serious. Clean whites, Montserrat, navy accents.',
    defaultColors: { primaryColor: '#0057b8', bgColor: '#f8f9fb', textColor: '#1a2332', accentColor: '#0ea5e9' },
    preview: ENTERPRISE_PREVIEW,
  },
  {
    key: 'ghetto',
    label: 'Ghetto',
    description: 'Bold & disruptive. Impact, fiery reds, street-style vibes.',
    defaultColors: { primaryColor: '#ff3b3b', bgColor: '#111111', textColor: '#ffffff', accentColor: '#ffcc00' },
    preview: GHETTO_PREVIEW,
  },
];

/* ── Color field ─────────────────────────────────────────────────────────── */
interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 36,
          height: 36,
          border: '2px solid var(--border-color)',
          borderRadius: 8,
          padding: 2,
          cursor: 'pointer',
          background: 'none',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <input
          type="text"
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', fontFamily: 'monospace', height: 'auto' }}
        />
      </div>
    </div>
  );
}

/* ── Props ─────────────────────────────────────────────────────────────── */
interface ThemePanelProps {
  shopId: string;
  shopName: string;
  onClose?: () => void;
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function ThemePanel({ shopId, shopName, onClose }: ThemePanelProps) {
  const [themeKey, setThemeKey] = useState('dev');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [headerName, setHeaderName] = useState('');
  const [colors, setColors] = useState<ThemeColors>({
    primaryColor: '#39ff14',
    bgColor: '#0d1117',
    textColor: '#c9d1d9',
    accentColor: '#58a6ff',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadError, setLoadError] = useState('');

  /* Load current theme from API */
  useEffect(() => {
    if (!shopId) return;
    void getShopPublicTheme(shopId)
      .then((t) => {
        setThemeKey(t.themeKey || 'dev');
        const h = t.config?.hero;
        setHeroTitle((h as { title?: string })?.title ?? '');
        setHeroSubtitle((h as { subtitle?: string })?.subtitle ?? '');
        setHeaderName((t.config?.headerName as string) ?? '');
        if (t.config?.colors && typeof t.config.colors === 'object') {
          setColors((prev) => ({ ...prev, ...(t.config.colors as ThemeColors) }));
        }
      })
      .catch(() => setLoadError('Could not load current theme.'));
  }, [shopId]);

  /* When theme changes, reset to that theme's defaults (only if user hasn't customized) */
  const handleThemeChange = (key: string) => {
    setThemeKey(key);
    const meta = THEMES.find((t) => t.key === key);
    if (meta) setColors(meta.defaultColors);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const config: ThemeConfig = {
        hero: {
          title: heroTitle.trim() || undefined,
          subtitle: heroSubtitle.trim() || undefined,
        },
        colors,
        headerName: headerName.trim() || undefined,
      };
      await updateShopTheme(shopId, themeKey, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Error saving theme. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const activeThemeMeta = THEMES.find((t) => t.key === themeKey) ?? THEMES[0];

  /* ── Live mini-preview of current colors ─────────────────────────── */
  const LivePreview = () => (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        fontSize: '0.65rem',
        userSelect: 'none',
      }}
    >
      {/* Mini "header" bar */}
      <div style={{ background: colors.bgColor, padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.primaryColor}33` }}>
        <span style={{ fontWeight: 800, color: colors.primaryColor, letterSpacing: 1 }}>
          {headerName || shopName || 'Mi Tienda'}
        </span>
        <span style={{ color: colors.accentColor, fontSize: '0.6rem' }}>◉ live</span>
      </div>
      {/* Mini "hero" */}
      <div style={{ background: colors.bgColor, padding: '0.6rem 0.75rem' }}>
        <div style={{ color: colors.primaryColor, fontWeight: 700, fontSize: '0.7rem', marginBottom: '0.15rem' }}>
          {heroTitle || shopName || 'Tu tienda'}
        </div>
        <div style={{ color: colors.textColor, opacity: 0.7, marginBottom: '0.4rem' }}>
          {heroSubtitle || 'Subtítulo de la tienda'}
        </div>
        {/* Mini product card */}
        <div style={{ background: `${colors.primaryColor}18`, border: `1px solid ${colors.primaryColor}44`, borderRadius: 5, padding: '0.4rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: colors.textColor }}>Producto ejemplo</span>
          <span style={{ background: colors.primaryColor, color: colors.bgColor, borderRadius: 3, padding: '0.1rem 0.4rem', fontWeight: 700 }}>$29</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 90,
        padding: '1rem',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="card" style={{ width: 'min(720px, 96%)', maxHeight: '92vh', overflowY: 'auto', padding: '1.25rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={18} /> Visual Settings
          </h3>
          {onClose && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <X size={16} /> Cerrar
            </button>
          )}
        </div>

        {loadError && <p style={{ color: 'var(--danger, #ef4444)', marginBottom: '1rem', fontSize: '0.85rem' }}>{loadError}</p>}

        {/* Two-column: theme picker + live preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(140px, 160px)', gap: '1rem', marginBottom: '1rem', alignItems: 'start' }}>
          {/* Theme picker */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Seleccionar plantilla
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
              {THEMES.map((t) => {
                const active = themeKey === t.key;
                return (
                  <div
                    key={t.key}
                    onClick={() => handleThemeChange(t.key)}
                    style={{
                      borderRadius: 10,
                      border: `2px solid ${active ? t.defaultColors.primaryColor : 'var(--border-color)'}`,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: active ? `0 0 16px ${t.defaultColors.primaryColor}44` : 'none',
                      position: 'relative',
                    }}
                  >
                    <div style={{ background: t.defaultColors.bgColor, padding: '0.5rem', minHeight: 60 }}>
                      {t.preview}
                    </div>
                    <div style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg, #1a1a2e)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: active ? t.defaultColors.primaryColor : 'var(--text-primary)' }}>{t.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{t.description}</div>
                      </div>
                      {active && <Check size={16} color={t.defaultColors.primaryColor} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vista previa en vivo
            </label>
            <LivePreview />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
              Se actualiza con tus cambios
            </p>
          </div>
        </div>

        {/* Customization grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Color pickers compact */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colores</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ColorField label="Primario" value={colors.primaryColor ?? activeThemeMeta.defaultColors.primaryColor ?? '#39ff14'} onChange={(v) => setColors((c) => ({ ...c, primaryColor: v }))} />
              <ColorField label="Fondo" value={colors.bgColor ?? activeThemeMeta.defaultColors.bgColor ?? '#0d1117'} onChange={(v) => setColors((c) => ({ ...c, bgColor: v }))} />
              <ColorField label="Texto" value={colors.textColor ?? activeThemeMeta.defaultColors.textColor ?? '#c9d1d9'} onChange={(v) => setColors((c) => ({ ...c, textColor: v }))} />
              <ColorField label="Secundario" value={colors.accentColor ?? activeThemeMeta.defaultColors.accentColor ?? '#58a6ff'} onChange={(v) => setColors((c) => ({ ...c, accentColor: v }))} />
            </div>
            <button type="button" style={{ marginTop: '0.5rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '0.25rem 0.65rem', fontSize: '0.72rem', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setColors(activeThemeMeta.defaultColors)}>
              ↺ Restaurar por defecto
            </button>
          </div>

          {/* Text customization */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Texto de la Web</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Header</div>
                <input type="text" className="input-field" placeholder={`Default: ${shopName}`} value={headerName} onChange={(e) => setHeaderName(e.target.value)} style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Título principal</div>
                <input type="text" className="input-field" placeholder={`Default: ${shopName}`} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Subtítulo</div>
                <input type="text" className="input-field" placeholder="Subtítulo de la tienda..." value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSave()}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem' }}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar tema'}
          </button>
        </div>
      </div>
    </div>
  );
}
