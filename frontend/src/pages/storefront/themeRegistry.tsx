import type { ComponentType } from 'react';
import type { ThemeViewProps } from './themeTypes';
import DevStyle from '../template/DevStyle';
import EntrepriseStyle from '../template/EntrepriseStyle';
import GhettoStyle from '../template/GhettoStyle';

export const THEME_REGISTRY: Record<string, ComponentType<ThemeViewProps>> = {
  dev: DevStyle,
  enterprise: EntrepriseStyle,
  ghetto: GhettoStyle,
};

export const DEFAULT_THEME_KEY = 'dev';

export type RegistryThemeKey = keyof typeof THEME_REGISTRY;
