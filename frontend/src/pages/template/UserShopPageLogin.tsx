import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, X } from 'lucide-react';
import { loginShopUser, registerShopUser } from '../../api/user-service/user-service';
import { getApiErrorMessage } from '../../api/api';
import { getShopPublicTheme } from '../../api/shop-service/shop-api';
import type { ShopThemeJson } from '../storefront/themeTypes';

interface Props {
  shopId: string;
  shopName: string;
  themeKey?: string;
  themeConfig?: ShopThemeJson | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

type AuthMode = 'login' | 'register';

function resolvePalette(themeConfig: ShopThemeJson | null | undefined) {
  const colors = (themeConfig?.colors as Record<string, string> | undefined) ?? {};

  return {
    primary: colors.primaryColor ?? '#5b6cff',
    accent: colors.accentColor ?? '#7ee0b8',
    bg: colors.bgColor ?? '#0c111b',
    surface: `color-mix(in srgb, ${colors.bgColor ?? '#0c111b'} 84%, #000)`,
    text: colors.textColor ?? '#e8eefc',
    muted: '#8f9ab3',
    shadow: 'rgba(0, 0, 0, 0.4)',
    font: 'inherit',
  };
}

export default function UserShopPageLogin({ shopId, shopName, themeKey, themeConfig, onSuccess, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [resolvedTheme, setResolvedTheme] = useState<{ themeKey?: string; themeConfig: ShopThemeJson | null }>({
    themeKey,
    themeConfig: themeConfig ?? null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadTheme = async () => {
      try {
        const theme = await getShopPublicTheme(shopId);
        if (cancelled) return;

        setResolvedTheme({
          themeKey: theme.themeKey,
          themeConfig: (theme.config ?? null) as ShopThemeJson | null,
        });
      } catch {
        if (!cancelled) {
          setResolvedTheme({
            themeKey,
            themeConfig: themeConfig ?? null,
          });
        }
      }
    };

    void loadTheme();

    return () => {
      cancelled = true;
    };
  }, [shopId, themeConfig, themeKey]);

  const palette = useMemo(() => resolvePalette(resolvedTheme.themeConfig), [resolvedTheme.themeConfig]);
  const fontFamily = useMemo(() => {
    if (resolvedTheme.themeKey === 'enterprise') return 'Montserrat, Helvetica Neue, sans-serif';
    if (resolvedTheme.themeKey === 'ghetto') return 'Oswald, Arial Black, sans-serif';
    return 'Source Code Pro, Fira Code, monospace';
  }, [resolvedTheme.themeKey]);
  const isRegister = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'register') {
        await registerShopUser(shopId, {
          email: email.trim(),
          password,
          phoneNumber: phoneNumber.trim() || undefined,
        });
      } else {
        await loginShopUser(shopId, { email: email.trim(), password });
      }
      onSuccess?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="shop-auth-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: `linear-gradient(135deg, color-mix(in srgb, ${palette.bg} 88%, #000), rgba(0,0,0,0.82))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        backdropFilter: 'blur(14px)',
        overflowY: 'auto',
        fontFamily,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="shop-auth-shell"
        style={{
          background: `linear-gradient(145deg, ${palette.surface}, color-mix(in srgb, ${palette.surface} 72%, ${palette.primary}) 100%)`,
          border: `1px solid color-mix(in srgb, ${palette.primary} 22%, transparent)`,
          borderRadius: '18px',
          padding: '0',
          width: '100%',
           maxWidth: '520px',
          position: 'relative',
          boxShadow: `0 18px 48px ${palette.shadow}`,
          overflow: 'hidden',
          margin: 'auto',
        }}
      >
        <style>{`
          .shop-auth-shell {
            animation: shopAuthIn 220ms ease-out;
          }

          @keyframes shopAuthIn {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (max-width: 900px) {
            .shop-auth-grid {
              grid-template-columns: 1fr !important;
            }

            .shop-auth-hero {
              min-height: 240px !important;
            }
          }
        `}</style>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid color-mix(in srgb, ${palette.text} 12%, transparent)`,
              cursor: 'pointer',
              color: palette.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.6rem',
              borderRadius: '999px',
              zIndex: 2,
              backdropFilter: 'blur(10px)',
            }}
          >
            <X size={20} />
          </button>
        )}

        <div className="shop-auth-grid" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>

            <section style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>


              <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.35rem', color: palette.text, fontWeight: 800 }}>
                {isRegister
                  ? `Regístrate en ${shopName}`
                  : `¿Eres cliente? `}
              </h2>
              <p style={{ color: palette.muted, margin: 0, lineHeight: 1.6 }}>
                {isRegister
                  ? 'Crea tu cuenta para obtener cotizaciones y mejores tarifas.'
                  : 'Accede a tu cuenta para beneficios.'}
              </p>
            </div>


            {error && (
              <div
                style={{
                  background: 'rgba(255,77,79,0.12)',
                  color: '#ff7a7d',
                  border: '1px solid rgba(255,77,79,0.24)',
                  padding: '0.95rem 1rem',
                  borderRadius: '16px',
                  marginBottom: '1rem',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isRegister && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Phone number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: palette.muted, pointerEvents: 'none' }} />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="5550000000"
                      style={{
                        width: '100%',
                        padding: '0.8rem 0.9rem 0.8rem 2.7rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid color-mix(in srgb, ${palette.text} 12%, transparent)`,
                        borderRadius: '14px',
                        color: palette.text,
                        fontSize: '0.95rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: palette.muted, pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.8rem 0.9rem 0.8rem 2.7rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid color-mix(in srgb, ${palette.text} 12%, transparent)`,
                      borderRadius: '14px',
                      color: palette.text,
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: palette.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: palette.muted, pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '0.8rem 2.9rem 0.8rem 2.7rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid color-mix(in srgb, ${palette.text} 12%, transparent)`,
                      borderRadius: '14px',
                      color: palette.text,
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.9rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: palette.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? `color-mix(in srgb, ${palette.primary} 55%, #fff)` : `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                  color: '#000',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '0.95rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '0.4rem',
                  boxShadow: `0 16px 30px color-mix(in srgb, ${palette.primary} 20%, transparent)`,
                }}
              >
                {loading ? (
                  isRegister ? 'Creating account…' : 'Signing in…'
                ) : isRegister ? (
                  'Create account'
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(isRegister ? 'login' : 'register')}
              style={{
                marginTop: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: palette.text,
                width: '100%',
                fontSize: '0.92rem',
                textAlign: 'center',
              }}
            >
              {isRegister ? 'Ya tienes cuenta? Inicia sesión' : 'No tienes cuenta? Regístrate aquí'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
