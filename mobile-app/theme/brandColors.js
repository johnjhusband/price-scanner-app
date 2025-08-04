// Flippi.ai Brand Color System - 2025 Refresh
// Luxury Trust & Authentication Color Palette

export const brandColors = {
  // Primary Brand Colors - Updated for 2025
  slateTeal: '#3F5954',         // Keep original - Primary UI color
  deepTeal: '#1D5C5A',          // Keep original - Buttons, headers, CTAs
  softCream: '#F3EFEA',         // Keep original - Backgrounds, sections
  offWhite: '#FBF8F2',          // Keep original - Secondary background
  matteGold: '#C8A863',         // Keep original - Accent text
  mutedGraphite: '#1E2A28',     // Keep original - Body text
  softTaupeBeige: '#D6C6B5',    // Keep original - Secondary UI elements
  
  // Additional colors for accessibility
  ctaBlue: '#0066CC',           // Color blind friendly CTA
  successBlue: '#2563EB',       // Color blind friendly success
  warningAmber: '#F59E0B',      // Color blind friendly warning
  errorRed: '#DC2626',          // Color blind friendly error
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#0A0A0A',      // Maps to trueBlack
  lightGray: '#D6C6B5',         // Maps to softTaupeBeige
  slateBlueGray: '#0A3D5C',     // Maps to deepOceanBlue
  actionPurple: '#FF6B6B',      // Maps to livingCoral for CTA buttons
  actionPurpleHover: '#FF5252', // Darker coral for hover state
  successGreen: '#87A96B',      // Maps to sageGreen for success
  
  // Additional 2025 colors
  error: '#E53E3E',             // Error states
  warning: '#DD6B20',           // Warning states
  info: '#3182CE',              // Info states
  
  // Text Colors
  primaryText: '#1E2A28',       // Main text (mutedGraphite)
  secondaryText: '#3F5954',     // Notes, smaller UI (slateTeal)
  disabledText: '#D6C6B5',      // Inactive states (softTaupeBeige)
  
  // Favicon Background
  faviconBg: '#1D5C5A',         // Favicon background color (deepTeal)
  
  // App Background
  background: '#FBF8F2',        // Off-white background for luxury feel
  surface: '#F3EFEA',           // Soft cream for cards and results
  
  // UI Elements
  border: '#D6C6B5',            // Soft taupe beige for borders
  
  // Additional colors for specific uses
  text: '#1E2A28',              // Alias for primaryText
  textSecondary: '#3F5954',     // Alias for secondaryText
  primary: '#1D5C5A',           // Primary action color (deepTeal)
  accent: '#0066CC',            // Color blind friendly accent
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const typography = {
  // Single font family for consistency
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  
  // Keep same fonts for backward compatibility
  headingFont: 'Poppins, -apple-system, sans-serif',
  bodyFont: 'Poppins, -apple-system, sans-serif',
  monoFont: '"SF Mono", Monaco, Consolas, monospace',
  
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800'
  },
  sizes: {
    logo: 'custom',
    h1: '36px',
    h2: '28px',
    h3: '24px',
    body: '16px',
    small: '14px',
    notes: '12px'
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8'
  }
};

// Button styling constants
export const buttonStyles = {
  primary: {
    backgroundColor: brandColors.deepTeal,
    color: '#FFFFFF',
    hoverBackground: '#174B49',
  },
  secondary: {
    backgroundColor: brandColors.softTaupeBeige,
    color: brandColors.mutedGraphite,
    hoverBackground: '#C4B4A3',
  },
  accent: {
    backgroundColor: '#0066CC',  // Color blind friendly blue for CTAs
    color: '#FFFFFF', 
    hoverBackground: '#0052A3',
  },
  borderRadius: '8px',
  padding: {
    horizontal: '24px',
    vertical: '12px',
  },
  minHeight: '48px',
  minWidth: '120px',
  fontWeight: '600',
};

// Component-specific colors - 2025 update
export const componentColors = {
  uploadArea: {
    border: brandColors.softTaupeBeige,
    background: brandColors.softCream,
    hoverBorder: brandColors.deepTeal,
    hoverBackground: brandColors.offWhite,
  },
  results: {
    background: brandColors.softCream,
    border: brandColors.border,
  },
  scores: {
    high: brandColors.deepTeal,         // Success/high scores
    medium: brandColors.matteGold,      // Medium scores
    low: '#8A8A8A',                     // Low scores
  },
  trending: {
    hot: brandColors.livingCoral,       // Hot items
    warm: brandColors.warmMocha,        // Trending items
    cool: brandColors.digitalLavender,  // Niche items
  },
  authentication: {
    verified: '#2563EB',         // Blue for verified (color blind safe)
    uncertain: '#F59E0B',        // Amber for uncertain (distinguishable)
    low: '#DC2626',              // Red for low (with pattern/icon support)
  },
}; 