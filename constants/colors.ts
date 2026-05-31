// CrashGuard Color Tokens

export const Colors = {
  // Backgrounds
  background: '#0a0a0f',
  cardBackground: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.08)',

  // Primary Accent
  primary: '#ff3366',
  primaryDark: '#cc2952',
  primaryLight: '#ff668c',

  // Status Colors
  safe: '#00e5ff',
  safeLight: '#66edff',
  warning: '#ffaa00',
  warningLight: '#ffcc66',
  danger: '#ff3366',

  // Gradients
  gradients: {
    primary: ['#ff3366', '#ff0044'] as const,
    safe: ['#00e5ff', '#00b3cc'] as const,
    warning: ['#ffaa00', '#e69900'] as const,
    background: ['#0f1016', '#050508'] as const,
    card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] as const,
  },

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',

  // UI Elements
  divider: 'rgba(255,255,255,0.08)',
  inputBackground: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.15)',

  // Tab Bar
  tabBarBackground: '#0a0a0f',
  tabBarBorder: 'rgba(255,255,255,0.05)',
  tabBarActive: '#ff3366',
  tabBarInactive: 'rgba(255,255,255,0.4)',

  // Signal / Status
  online: '#00e5ff',
  offline: '#ff3366',
  gsmBar: '#ffaa00',

  // Overlay
  overlay: 'rgba(0,0,0,0.85)',
  alertOverlay: 'rgba(255,51,102,0.15)',
} as const;

export type ColorKey = keyof typeof Colors;
