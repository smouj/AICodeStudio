/**
 * AICodeStudio Design Tokens
 *
 * Centralized visual system for the agent-first HUD.
 * All color, spacing, radius, shadow, and typography tokens
 * are defined here. Components should reference these tokens
 * via CSS custom properties or Tailwind theme extensions,
 * never via hardcoded hex values.
 */

// ─── Color Tokens ─────────────────────────────────────────────

export const colors = {
  // Backgrounds (darkest → lightest)
  bg: {
    root:       '#080c12',  // App root background
    base:       '#050810',  // Title/activity bar, tab bar
    panel:      '#080c12',  // Sidebar, main panels
    surface:    '#0a0e14',  // Editor, terminal, cards
    elevated:   '#0d1117',  // Elevated surfaces, dropdowns
    hover:      '#161b22',  // Hover states
  },

  // Borders
  border: {
    default:  'rgba(0,212,170,0.08)',   // Subtle default borders
    muted:    'rgba(0,212,170,0.04)',   // Very subtle separators
    active:   'rgba(0,212,170,0.18)',   // Active/selected borders
    focus:    'rgba(0,212,170,0.35)',   // Focus ring
  },

  // Text
  text: {
    primary:   '#e6edf3',   // Primary readable text
    secondary: '#8b949e',   // Secondary/informational
    muted:     '#6e7681',   // Tertiary/less important
    dim:       '#484f58',   // Very subtle/disabled-adjacent
    disabled:  '#30363d',   // Disabled/inactive text
  },

  // Accent (agent teal — use sparingly)
  accent: {
    DEFAULT:   '#00d4aa',
    dim:       'rgba(0,212,170,0.12)',
    subtle:    'rgba(0,212,170,0.06)',
    glow:      'rgba(0,212,170,0.25)',
  },

  // Semantic colors
  success: {
    DEFAULT: '#3fb950',
    dim:     'rgba(63,185,80,0.15)',
  },
  warning: {
    DEFAULT: '#ffa657',
    dim:     'rgba(255,166,87,0.15)',
  },
  danger: {
    DEFAULT: '#f85149',
    dim:     'rgba(248,81,73,0.12)',
  },
  info: {
    DEFAULT: '#58a6ff',
    dim:     'rgba(88,166,255,0.12)',
  },
} as const

// ─── Spacing Tokens ───────────────────────────────────────────

export const spacing = {
  0:   '0px',
  0.5: '2px',
  1:   '4px',
  1.5: '6px',
  2:   '8px',
  2.5: '10px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
} as const

// ─── Radius Tokens ────────────────────────────────────────────

export const radius = {
  none: '0px',
  sm:   '2px',
  md:   '4px',
  lg:   '6px',
  xl:   '8px',
} as const

// ─── Shadow Tokens ────────────────────────────────────────────

export const shadows = {
  none:    'none',
  sm:      '0 1px 2px rgba(0,0,0,0.3)',
  md:      '0 2px 8px rgba(0,0,0,0.4)',
  lg:      '0 4px 16px rgba(0,0,0,0.5)',
  tooltip: '0 4px 12px rgba(0,0,0,0.6)',
  glow:    '0 0 8px rgba(0,212,170,0.12)',
} as const

// ─── Typography Tokens ────────────────────────────────────────

export const typography = {
  fontFamily: {
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', var(--font-geist-mono), monospace",
    sans: "var(--font-geist-sans), system-ui, sans-serif",
  },
  fontSize: {
    xs:   '9px',
    sm:   '10px',
    base: '11px',
    md:   '12px',
    lg:   '13px',
    xl:   '14px',
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
  },
  lineHeight: {
    tight:  '1.3',
    normal: '1.5',
    relaxed: '1.7',
  },
} as const

// ─── Animation Tokens ─────────────────────────────────────────

export const animation = {
  duration: {
    fast:   '100ms',
    normal: '200ms',
    slow:   '300ms',
  },
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ─── Z-Index Scale ────────────────────────────────────────────

export const zIndex = {
  base:       0,
  panel:      10,
  overlay:    20,
  dropdown:   30,
  sticky:     40,
  modal:      50,
  popover:    60,
  toast:      70,
  tooltip:    80,
  max:        100,
} as const
