// Flippi.ai Brand Color System - 2025 Refresh
// Luxury Trust & Authentication Color Palette

export const brandColors = {
  // Primary Brand Colors - Updated for 2025
  deepOceanBlue: '#0A3D5C',     // Primary trust color for authentication (replaces deepTeal)
  trueBlack: '#0A0A0A',         // Luxury positioning, high contrast (replaces mutedGraphite)
  warmMocha: '#A57865',         // Pantone 2025 Color of the Year - warm luxury
  softCream: '#F3EFEA',         // Backgrounds, sections, secondary UI fill (kept)
  offWhite: '#FBF8F2',          // Secondary background and form areas (kept)
  digitalLavender: '#B8A9E5',   // Gen Z engagement, social features
  livingCoral: '#FF6B6B',       // High-converting CTAs, urgency
  ctaBlue: '#0066CC',          // Color blind friendly CTA alternative
  sageGreen: '#87A96B',         // Sustainability, environmental messaging
  
  // Legacy mappings for compatibility
  slateTeal: '#0A3D5C',         // Maps to deepOceanBlue
  deepTeal: '#0A3D5C',          // Maps to deepOceanBlue
  matteGold: '#A57865',         // Maps to warmMocha
  mutedGraphite: '#0A0A0A',     // Maps to trueBlack
  softTaupeBeige: '#D6C6B5',    // Secondary UI elements, shadows, neutral backgrounds
  
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
  
  // Text Colors - Updated for better contrast
  primaryText: '#0A0A0A',       // Main text (trueBlack)
  secondaryText: '#4A5568',     // Notes, smaller UI (better contrast)
  disabledText: '#A0AEC0',      // Inactive states (improved visibility)
  
  // Favicon Background
  faviconBg: '#0A3D5C',         // Favicon background color (deepOceanBlue)
  
  // App Background
  background: '#FBF8F2',        // Off-white background for luxury feel
  surface: '#F3EFEA',           // Soft cream for cards and results
  
  // UI Elements
  border: '#E2E8F0',            // Lighter borders for modern feel
  borderHover: '#CBD5E0',       // Hover state borders
  
  // Additional colors for specific uses
  text: '#0A0A0A',              // Alias for primaryText
  textSecondary: '#4A5568',     // Alias for secondaryText
  primary: '#0A3D5C',           // Primary action color (deepOceanBlue)
  accent: '#FF6B6B',            // Accent color (livingCoral)
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const typography = {
  // Primary font families - 2025 update
  headingFont: '"Playfair Display", Georgia, serif',
  bodyFont: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  monoFont: '"JetBrains Mono", "SF Mono", Consolas, monospace',
  
  // Fallback to existing for gradual migration
  fontFamily: '"Inter", "Poppins", -apple-system, sans-serif',
  
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
    h1: '32px',      // Reduced for better mobile experience
    h2: '24px',      // Reduced from 28px
    h3: '20px',      // Reduced from 24px
    body: '18px',    // Increased from 16px for mobile readability
    small: '16px',   // Increased from 14px
    notes: '14px',   // Increased from 12px
    
    // Mobile specific sizes
    mobileH1: '28px',
    mobileH2: '22px',
    mobileH3: '18px',
    mobileBody: '18px',
    mobileSmall: '16px'
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8'
  }
};

// Button styling constants - 2025 update
export const buttonStyles = {
  primary: {
    backgroundColor: brandColors.deepOceanBlue,
    color: '#FFFFFF',
    hoverBackground: '#083449', // Darker ocean blue
  },
  secondary: {
    backgroundColor: brandColors.softCream,
    color: brandColors.trueBlack,
    hoverBackground: '#E7E3DE',
  },
  accent: {
    backgroundColor: '#0066CC',  // Color blind friendly blue
    color: '#FFFFFF', 
    hoverBackground: '#0052A3', // Darker blue
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
    border: brandColors.border,
    background: brandColors.softCream,
    hoverBorder: brandColors.deepOceanBlue,
    hoverBackground: brandColors.offWhite,
  },
  results: {
    background: brandColors.softCream,
    border: brandColors.border,
  },
  scores: {
    high: brandColors.sageGreen,        // Success/high scores
    medium: brandColors.warmMocha,      // Medium scores with warm feel
    low: '#6B7280',                     // Neutral gray for low scores
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