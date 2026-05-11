import { useStore } from './store';

export const darkColors = {
  background: '#0b121e', // deeper navy from DESIGN.md text
  surface: '#161f2c', // cards and containers
  border: '#1e293b',
  text: '#dce2f4',
  textMuted: '#8d919b',
  primary: '#2b5797', // Blue (Confirmations, navigation)
  primaryActive: '#aac7ff',
  secondary: '#4e8c57', // Green (Primary actions)
  warning: '#c67c2d', // Orange (Direct emergency)
  danger: '#a62626', // Red (High-priority alerts)
  dangerBackground: '#93000a',
};

export const lightColors = {
  background: '#f8fafc', // Very light grey/blue
  surface: '#ffffff', // white cards
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#3b82f6', 
  primaryActive: '#2563eb',
  secondary: '#16a34a', 
  warning: '#ea580c',
  danger: '#dc2626', 
  dangerBackground: '#fef2f2',
};

export const theme = {
  colors: darkColors, // Default fallback

  spacing: {
    xs: 4,
    sm: 8, // 8px baseline
    md: 16,
    lg: 20, // margins
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 8, // Small UI controls
    md: 16, // Primary buttons and cards
    lg: 24, // Bottom navigation top corners
  },
  typography: {
    fontFamily: 'System', // Fallback until Inter is loaded, assuming System for now to avoid complexity, Expo uses system fonts easily
    sizes: {
      sm: 12,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};

export const useAppTheme = () => {
  const themeMode = useStore((state) => state.themeMode);
  return {
    ...theme,
    colors: themeMode === 'light' ? lightColors : darkColors,
  };
};
