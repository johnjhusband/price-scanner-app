// Flippi.ai Responsive Design System
// Mobile-first approach with consistent scaling

import { Dimensions, Platform } from 'react-native';

const { width: windowWidth } = Dimensions.get('window');

// Breakpoints (matching Tailwind conventions)
export const breakpoints = {
  sm: 640,   // Small devices
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large screens
};

// Device detection
export const isMobile = windowWidth < breakpoints.md;
export const isTablet = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
export const isDesktop = windowWidth >= breakpoints.lg;

// Responsive Typography Scale
export const fontSize = {
  // Base sizes (mobile-first)
  xs: 12,    // Caption text
  sm: 14,    // Small text
  base: 16,  // Body text
  lg: 18,    // Large body
  xl: 20,    // Heading 3
  '2xl': 24, // Heading 2
  '3xl': 28, // Heading 1
  '4xl': 32, // Display

  // Responsive helpers
  responsive: (mobile, desktop) => isMobile ? mobile : desktop,
};

// Responsive Spacing Scale (matching Tailwind)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  
  // Responsive helpers
  responsive: (mobile, desktop) => isMobile ? mobile : desktop,
};

// Typography Styles with Responsive Sizing
export const typography = {
  // Display/Logo
  display: {
    fontSize: fontSize.responsive(32, 40),
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: fontSize.responsive(24, 32),
    fontWeight: '700',
    lineHeight: 1.2,
  },
  
  h2: {
    fontSize: fontSize.responsive(20, 24),
    fontWeight: '600',
    lineHeight: 1.3,
  },
  
  h3: {
    fontSize: fontSize.responsive(18, 20),
    fontWeight: '600',
    lineHeight: 1.4,
  },
  
  // Body text
  body: {
    fontSize: fontSize.responsive(16, 17),
    fontWeight: '400',
    lineHeight: 1.5,
  },
  
  bodySmall: {
    fontSize: fontSize.responsive(14, 15),
    fontWeight: '400',
    lineHeight: 1.5,
  },
  
  // Labels
  label: {
    fontSize: fontSize.responsive(14, 16),
    fontWeight: '500',
    lineHeight: 1.4,
  },
  
  // Captions
  caption: {
    fontSize: fontSize.responsive(12, 13),
    fontWeight: '400',
    lineHeight: 1.4,
  },
  
  // Numerical emphasis
  numerical: {
    fontSize: fontSize.responsive(20, 24),
    fontWeight: '600',
  },
};

// Responsive Padding/Margin Utilities
export const responsivePadding = {
  // Vertical padding (py)
  py: {
    2: { paddingVertical: spacing.responsive(8, 8) },
    3: { paddingVertical: spacing.responsive(12, 12) },
    4: { paddingVertical: spacing.responsive(16, 16) },
    6: { paddingVertical: spacing.responsive(20, 24) },
    8: { paddingVertical: spacing.responsive(24, 32) },
  },
  
  // Horizontal padding (px)
  px: {
    2: { paddingHorizontal: spacing.responsive(8, 8) },
    3: { paddingHorizontal: spacing.responsive(12, 12) },
    4: { paddingHorizontal: spacing.responsive(16, 16) },
    6: { paddingHorizontal: spacing.responsive(20, 24) },
    8: { paddingHorizontal: spacing.responsive(24, 32) },
  },
  
  // All padding (p)
  p: {
    2: { padding: spacing.responsive(8, 8) },
    3: { padding: spacing.responsive(12, 12) },
    4: { padding: spacing.responsive(16, 16) },
    6: { padding: spacing.responsive(20, 24) },
    8: { padding: spacing.responsive(24, 32) },
  },
};

// Responsive Margin Utilities
export const responsiveMargin = {
  // Bottom margin (mb)
  mb: {
    2: { marginBottom: spacing.responsive(8, 8) },
    3: { marginBottom: spacing.responsive(12, 12) },
    4: { marginBottom: spacing.responsive(16, 16) },
    6: { marginBottom: spacing.responsive(20, 24) },
    8: { marginBottom: spacing.responsive(24, 32) },
  },
  
  // Top margin (mt)
  mt: {
    2: { marginTop: spacing.responsive(8, 8) },
    3: { marginTop: spacing.responsive(12, 12) },
    4: { marginTop: spacing.responsive(16, 16) },
    6: { marginTop: spacing.responsive(20, 24) },
    8: { marginTop: spacing.responsive(24, 32) },
  },
};

// Button Sizes with Responsive Scaling
export const buttonSizes = {
  sm: {
    paddingVertical: spacing.responsive(8, 10),
    paddingHorizontal: spacing.responsive(16, 20),
    fontSize: fontSize.responsive(14, 15),
    minHeight: 40,
  },
  base: {
    paddingVertical: spacing.responsive(12, 16),
    paddingHorizontal: spacing.responsive(24, 32),
    fontSize: fontSize.responsive(16, 17),
    minHeight: spacing.responsive(48, 52),
  },
  lg: {
    paddingVertical: spacing.responsive(16, 20),
    paddingHorizontal: spacing.responsive(32, 40),
    fontSize: fontSize.responsive(18, 19),
    minHeight: spacing.responsive(56, 60),
  },
};

// Container widths
export const containerWidths = {
  sm: '100%',
  md: isDesktop ? '768px' : '100%',
  lg: isDesktop ? '1024px' : '100%',
  xl: isDesktop ? '1280px' : '100%',
};

// Helper function to apply responsive styles
export const responsive = (mobileStyle, desktopStyle) => {
  return isMobile ? mobileStyle : desktopStyle;
};

export default {
  breakpoints,
  fontSize,
  spacing,
  typography,
  responsivePadding,
  responsiveMargin,
  buttonSizes,
  containerWidths,
  responsive,
  isMobile,
  isTablet,
  isDesktop,
};