// CIVIC-REZO Institutional Theme
// Clean, monochrome, professional — inspired by architectural / civic design language

export const EnvironmentalTheme = {
  // Primary Colors — Monochrome Blacks
  primary: {
    main: '#1A1A1A',       // Near-black
    light: '#333333',      // Dark gray
    dark: '#000000',       // True black
    surface: '#F5F5F5',    // Light warm gray
  },

  // Secondary Colors — Neutral Grays
  secondary: {
    main: '#6B7280',       // Medium gray
    light: '#9CA3AF',      // Light gray
    dark: '#374151',       // Charcoal
    surface: '#F9FAFB',    // Off-white
  },

  // Accent Colors — Minimal, purposeful (monochrome)
  accent: {
    red: '#1A1A1A',        // Replaced Alert / Critical
    amber: '#1A1A1A',      // Replaced Warning
    teal: '#1A1A1A',       // Replaced Success
    blue: '#1A1A1A',       // Replaced Informational
  },

  // Neutral Colors — Warm grays
  neutral: {
    white: '#FFFFFF',
    light: '#FAFAFA',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray500: '#6B7280',
    gray700: '#374151',
    gray900: '#111827',
    black: '#0A0A0A',
  },

  // Status Colors (monochrome)
  status: {
    success: '#1A1A1A',
    warning: '#1A1A1A',
    error: '#1A1A1A',
    info: '#1A1A1A',
  },

  // Gradients — Subtle, professional (monochrome)
  gradients: {
    primary: ['#1A1A1A', '#333333'],
    secondary: ['#374151', '#6B7280'],
    dark: ['#000000', '#1A1A1A'],
    forest: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    ocean: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
  },

  // Spacing System
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius — Sharp, architectural
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },

  // Typography — Clean, professional
  typography: {
    h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
    h3: { fontSize: 22, fontWeight: '600', letterSpacing: -0.2 },
    h4: { fontSize: 18, fontWeight: '600', letterSpacing: 0 },
    body1: { fontSize: 16, fontWeight: '400', letterSpacing: 0.1 },
    body2: { fontSize: 14, fontWeight: '400', letterSpacing: 0.1 },
    caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2 },
    label: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  },

  // Shadows — Subtle, refined
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export default EnvironmentalTheme;
