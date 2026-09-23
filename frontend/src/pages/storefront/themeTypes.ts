import type { Product } from '../template/DevStyle';

export type ShopThemeJson = Record<string, unknown>;

export type ThemeViewProps = {
  shopId: string;
  shopName: string;
  themeConfig: ShopThemeJson | null;
  /** Si viene vacío, cada plantilla usa su catálogo demo. */
  catalogProducts?: Product[];
  hasActiveSession?: boolean;
};

export function readHeroTitle(themeConfig: ShopThemeJson | null | undefined, shopName: string): string {
  const raw =
    themeConfig &&
    typeof themeConfig.hero === 'object' &&
    themeConfig.hero !== null &&
    typeof (themeConfig.hero as { title?: unknown }).title === 'string'
      ? ((themeConfig.hero as { title: string }).title as string).trim()
      : '';
  return raw || shopName || 'Tu tienda';
}

export function hasConfiguredHeroTitle(themeConfig: ShopThemeJson | null | undefined): boolean {
  const t =
    themeConfig &&
    typeof themeConfig.hero === 'object' &&
    themeConfig.hero !== null &&
    typeof (themeConfig.hero as { title?: unknown }).title === 'string'
      ? (themeConfig.hero as { title: string }).title.trim()
      : '';
  return Boolean(t);
}

export function readHeroSubtitle(themeConfig: ShopThemeJson | null | undefined, fallback: string): string {
  const raw =
    themeConfig &&
    typeof themeConfig.hero === 'object' &&
    themeConfig.hero !== null &&
    typeof (themeConfig.hero as { subtitle?: unknown }).subtitle === 'string'
      ? ((themeConfig.hero as { subtitle: string }).subtitle as string).trim()
      : '';
  return raw || fallback;
}
