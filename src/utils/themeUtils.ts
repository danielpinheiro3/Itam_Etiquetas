import { SystemThemeConfig, SystemThemeColors, PresetThemeId } from '../types';

export const THEME_PRESETS: Record<PresetThemeId, { name: string; description: string; colors: SystemThemeColors }> = {
  'ambar-padrao': {
    name: 'Âmbar Almoxarifado (Padrão)',
    description: 'Interface industrial clássica com cabeçalho escuro e destaques em âmbar',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      secondary: '#475569',
      headerBg: '#0f172a',
      menuBg: '#0f172a',
      accent: '#10b981',
      buttonBg: '#f59e0b',
      buttonHover: '#fbbf24',
      buttonText: '#020617',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      bgPage: '#f8fafc',
      bgCard: '#ffffff',
      borderColor: '#e2e8f0'
    }
  },
  'azul-profissional': {
    name: 'Azul Profissional (Corporativo)',
    description: 'Design corporativo limpo com azul marinho e realces modernos',
    colors: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      secondary: '#64748b',
      headerBg: '#1e3a8a',
      menuBg: '#1e3a8a',
      accent: '#0284c7',
      buttonBg: '#2563eb',
      buttonHover: '#3b82f6',
      buttonText: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      bgPage: '#f8fafc',
      bgCard: '#ffffff',
      borderColor: '#e2e8f0'
    }
  },
  'azul-escuro': {
    name: 'Azul Escuro (Dark Navy)',
    description: 'Tons de azul profundo de alta elegância e contraste para expedição',
    colors: {
      primary: '#38bdf8',
      primaryHover: '#0284c7',
      secondary: '#94a3b8',
      headerBg: '#0b132b',
      menuBg: '#1c2541',
      accent: '#60a5fa',
      buttonBg: '#38bdf8',
      buttonHover: '#7dd3fc',
      buttonText: '#0b132b',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      bgPage: '#f1f5f9',
      bgCard: '#ffffff',
      borderColor: '#cbd5e1'
    }
  },
  'verde-industrial': {
    name: 'Verde Industrial (Logística & Sustentabilidade)',
    description: 'Estilo produtivo e logístico em verde floresta e esmeralda',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      secondary: '#4b5563',
      headerBg: '#064e3b',
      menuBg: '#064e3b',
      accent: '#10b981',
      buttonBg: '#059669',
      buttonHover: '#10b981',
      buttonText: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#4b5563',
      bgPage: '#f0fdf4',
      bgCard: '#ffffff',
      borderColor: '#d1fae5'
    }
  },
  'cinza-grafite': {
    name: 'Cinza Grafite (Técnico / Neutro)',
    description: 'Aparência neutra e discreta em ardósia para operações técnicas',
    colors: {
      primary: '#475569',
      primaryHover: '#334155',
      secondary: '#64748b',
      headerBg: '#1e293b',
      menuBg: '#1e293b',
      accent: '#f59e0b',
      buttonBg: '#475569',
      buttonHover: '#64748b',
      buttonText: '#ffffff',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      bgPage: '#f8fafc',
      bgCard: '#ffffff',
      borderColor: '#e2e8f0'
    }
  },
  'preto-moderno': {
    name: 'Preto Moderno (High Contrast)',
    description: 'Preto absoluto com tipografia nítida e alto contraste',
    colors: {
      primary: '#09090b',
      primaryHover: '#27272a',
      secondary: '#71717a',
      headerBg: '#000000',
      menuBg: '#09090b',
      accent: '#eab308',
      buttonBg: '#09090b',
      buttonHover: '#27272a',
      buttonText: '#ffffff',
      textPrimary: '#09090b',
      textSecondary: '#71717a',
      bgPage: '#fafafa',
      bgCard: '#ffffff',
      borderColor: '#e4e4e7'
    }
  },
  'personalizado': {
    name: 'Personalizado (Cores Livres)',
    description: 'Cores totalmente customizadas pelo usuário com seletor hexadecimal',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      secondary: '#475569',
      headerBg: '#0f172a',
      menuBg: '#0f172a',
      accent: '#10b981',
      buttonBg: '#f59e0b',
      buttonHover: '#fbbf24',
      buttonText: '#020617',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      bgPage: '#f8fafc',
      bgCard: '#ffffff',
      borderColor: '#e2e8f0'
    }
  }
};

export const DEFAULT_THEME_CONFIG: SystemThemeConfig = {
  presetId: 'ambar-padrao',
  colors: THEME_PRESETS['ambar-padrao'].colors
};

/**
 * Generates pure CSS variables and utility classes for the given theme
 */
export const generateThemeCss = (theme: SystemThemeConfig): string => {
  const c = theme.colors;
  return `
    :root {
      --color-theme-primary: ${c.primary};
      --color-theme-primary-hover: ${c.primaryHover};
      --color-theme-secondary: ${c.secondary};
      --color-theme-header-bg: ${c.headerBg};
      --color-theme-menu-bg: ${c.menuBg};
      --color-theme-accent: ${c.accent};
      --color-theme-btn-bg: ${c.buttonBg};
      --color-theme-btn-hover: ${c.buttonHover};
      --color-theme-btn-text: ${c.buttonText};
      --color-theme-text-primary: ${c.textPrimary};
      --color-theme-text-secondary: ${c.textSecondary};
      --color-theme-bg-page: ${c.bgPage};
      --color-theme-bg-card: ${c.bgCard};
      --color-theme-border: ${c.borderColor};
    }

    body {
      background-color: var(--color-theme-bg-page) !important;
    }

    header.theme-header, header {
      background-color: var(--color-theme-header-bg) !important;
    }

    .theme-card-bg {
      background-color: var(--color-theme-bg-card) !important;
      border-color: var(--color-theme-border) !important;
    }

    .theme-btn-primary {
      background-color: var(--color-theme-btn-bg) !important;
      color: var(--color-theme-btn-text) !important;
    }

    .theme-btn-primary:hover {
      background-color: var(--color-theme-btn-hover) !important;
    }

    .theme-text-primary {
      color: var(--color-theme-primary) !important;
    }

    .theme-border-primary {
      border-color: var(--color-theme-primary) !important;
    }
  `;
};

/**
 * Injects or updates dynamic CSS theme rules in the document head
 */
export const applyTheme = (theme: SystemThemeConfig): void => {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById('almox-system-theme-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'almox-system-theme-style';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = generateThemeCss(theme);
};

export const getStoredTheme = (): SystemThemeConfig => {
  try {
    const raw = localStorage.getItem('almox_theme_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.colors) return parsed;
    }
  } catch (e) {}
  return DEFAULT_THEME_CONFIG;
};

export const saveStoredTheme = (theme: SystemThemeConfig): void => {
  try {
    localStorage.setItem('almox_theme_config', JSON.stringify(theme));
  } catch (e) {}
};
