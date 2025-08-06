// Flippi.ai Brand Color System - Sophisticated & Inclusive
// Designed for women entrepreneurs who value authenticity and luxury

export const brandColors = {
  // Core Colors - Natural luxury palette
  primary: '#5B4B8A',           // Deep amethyst - creativity & luxury
  text: '#1A1A1A',              // Near black - high readability
  textSecondary: '#6B7280',     // Medium gray - secondary info
  background: '#FAF9F7',        // Warm white with hint of cream
  surface: '#FFFFFF',           // Pure white for cards
  border: '#E8E5E0',            // Warm gray borders
  
  // Accent Colors - Used sparingly
  success: '#7B8E77',           // Sage green - growth & authenticity
  error: '#DC2626',             // Red - only for errors
  
  // Legacy mappings for compatibility
  slateTeal: '#6B7280',         // Maps to textSecondary
  deepTeal: '#5B4B8A',          // Maps to primary (amethyst)
  softCream: '#FAF9F7',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#B5985A',         // Soft gold - premium feel
  mutedGraphite: '#1A1A1A',     // Maps to text
  softTaupeBeige: '#E8E5E0',    // Maps to border
  
  // Additional legacy mappings
  soil: '#1A1A1A',              // Maps to text
  forest: '#7B8E77',            // Maps to sage green
  leaf: '#7B8E77',              // Maps to success
  honey: '#B5985A',             // Soft gold accent
  sunset: '#DC2626',            // Maps to error
  ocean: '#5B4B8A',             // Maps to primary
  cream: '#FAF9F7',             // Maps to background
  sand: '#FAF9F7',              // Maps to background
  stone: '#6B7280',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#1A1A1A',      // Maps to text
  lightGray: '#E8E5E0',         // Maps to border
  slateBlueGray: '#5B4B8A',     // Maps to primary
  actionPurple: '#5B4B8A',      // Maps to primary for CTA buttons
  actionPurpleHover: '#4A3C70', // Darker amethyst for hover state
  successGreen: '#7B8E77',      // Maps to success
  
  // Semantic colors
  warning: '#B5985A',           // Soft gold for warnings
  info: '#8B7FB5',              // Light amethyst for info
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#5B4B8A',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#5B4B8A',          // Maps to primary
  
  // Focus states
  borderFocus: '#5B4B8A',       // Primary focus
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const typography = {
  // Single font family for entire app
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  
  // All text uses system fonts for consistency
  headingFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

// Button styling constants - Sophisticated Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#5B4B8A',  // Deep amethyst
    color: '#FFFFFF',
    hoverBackground: '#4A3C70',  // Darker amethyst
  },
  secondary: {
    backgroundColor: '#FAF9F7',  // Warm white
    color: '#5B4B8A',           // Amethyst text
    hoverBackground: '#F0EDE8', // Slightly darker cream
    borderColor: '#E8E5E0',     // Warm border
  },
  accent: {
    backgroundColor: '#B5985A',  // Soft gold for special CTAs
    color: '#FFFFFF', 
    hoverBackground: '#9B8149',
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

// Component-specific colors - Sophisticated & Warm
export const componentColors = {
  uploadArea: {
    border: '#E8E5E0',
    background: '#FFFFFF',
    hoverBorder: '#5B4B8A',
    hoverBackground: '#FAF9F7',
  },
  results: {
    background: '#FFFFFF',
    border: '#E8E5E0',
  },
  scores: {
    high: '#7B8E77',             // Sage green for good
    medium: '#B5985A',           // Soft gold for medium
    low: '#6B7280',              // Gray for low
  },
  authentication: {
    verified: '#7B8E77',         // Sage green checkmark
    uncertain: '#B5985A',        // Gold warning
    low: '#DC2626',              // Red alert
  },
}; 