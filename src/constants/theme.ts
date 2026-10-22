/**
 * Reeldex design tokens: warm paper whites, ink text and one emerald accent,
 * in the calm, document-like spirit of Notion and Claude.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B201C',
    background: '#FAFAF7',
    // Cards and sheets sit on the page as white paper.
    surface: '#FFFFFF',
    backgroundElement: '#F2F4EF',
    backgroundSelected: '#E4ECE3',
    border: '#E6E8E2',
    textSecondary: '#5D665E',
    textTertiary: '#8E968D',
    accent: '#0E7C4A',
    accentStrong: '#0A5C37',
    accentSoft: '#E4F2E9',
    onAccent: '#FFFFFF',
    warning: '#B54708',
    warningBackground: '#FFF4E5',
  },
  dark: {
    text: '#ECEFEA',
    background: '#0F1210',
    surface: '#161A17',
    backgroundElement: '#1C211D',
    backgroundSelected: '#253029',
    border: '#2A312C',
    textSecondary: '#A4ACA3',
    textTertiary: '#6F786F',
    accent: '#3DD68C',
    accentStrong: '#7BE6B0',
    accentSoft: '#15291E',
    onAccent: '#06190F',
    warning: '#F5B76E',
    warningBackground: '#3A2510',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Web loads Inter and Newsreader from Google Fonts (public/index.html);
// native falls back to the system faces.
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 18,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 84 }) ?? 0;
export const MaxContentWidth = 720;
