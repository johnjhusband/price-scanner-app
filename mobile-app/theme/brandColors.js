// Flippi.ai Brand Color System - Timeless & Sustainable
// Designed for daily use without fatigue, appealing to modern entrepreneurs

export const brandColors = {
  // Core Colors - Warm neutral base inspired by 2025 trends
  primary: '#8B7355',           // Mocha mousse - Pantone 2025, sophisticated warmth
  text: '#2C2825',              // Soft black - easier on eyes than pure black
  textSecondary: '#6B625A',     // Warm gray-brown - gentle contrast
  background: '#FAF8F5',        // Cream white - subtle warmth
  surface: '#FFFFFF',           // Pure white for cards
  border: '#E8E2DB',            // Warm beige borders
  
  // Accent Colors - Used sparingly
  success: '#7B8E77',           // Sage green - calming, natural
  error: '#C26B5C',             // Terracotta red - softer than pure red
  accent: '#6B8CAE',            // Soft blue - trust without masculinity
  accentLight: '#A3B8CC',       // Light blue-gray
  
  // Legacy mappings for compatibility
  slateTeal: '#6B625A',         // Maps to textSecondary
  deepTeal: '#8B7355',          // Maps to primary (mocha)
  softCream: '#FAF8F5',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#8B7355',         // Maps to primary for warmth
  mutedGraphite: '#2C2825',     // Maps to text
  softTaupeBeige: '#E8E2DB',    // Maps to border
  
  // Additional legacy mappings
  soil: '#2C2825',              // Maps to text
  forest: '#7B8E77',            // Maps to sage green
  leaf: '#7B8E77',              // Maps to success
  honey: '#D4A574',             // Warm honey tone
  sunset: '#C26B5C',            // Maps to error
  ocean: '#6B8CAE',             // Maps to accent
  cream: '#FAF8F5',             // Maps to background
  sand: '#FAF8F5',              // Maps to background
  stone: '#6B625A',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#2C2825',      // Maps to text
  lightGray: '#E8E2DB',         // Maps to border
  slateBlueGray: '#8B7355',     // Maps to primary
  actionPurple: '#8B7355',      // Maps to primary for CTA buttons
  actionPurpleHover: '#6F5D47', // Darker mocha for hover state
  successGreen: '#7B8E77',      // Maps to success
  
  // Semantic colors
  warning: '#D4A574',           // Warm honey for warnings
  info: '#6B8CAE',              // Soft blue for info
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#8B7355',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#8B7355',          // Maps to primary
  
  // Focus states
  borderFocus: '#8B7355',       // Primary focus
  
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

// Button styling constants - Timeless Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#8B7355',  // Mocha mousse
    color: '#FFFFFF',
    hoverBackground: '#6F5D47',  // Darker mocha
  },
  secondary: {
    backgroundColor: '#FAF8F5',  // Cream white
    color: '#8B7355',           // Mocha text
    hoverBackground: '#F0EBE5', // Slightly darker cream
    borderColor: '#E8E2DB',     // Warm border
  },
  accent: {
    backgroundColor: '#6B8CAE',  // Soft blue for special CTAs
    color: '#FFFFFF', 
    hoverBackground: '#557491',
  },
  ghost: {
    backgroundColor: 'transparent',  // No background
    color: '#4B5563',               // Medium gray text
    hoverBackground: '#F3F4F6',     // Light gray on hover
    borderColor: 'transparent',     // No border
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

// Component-specific colors - Timeless & Calming
export const componentColors = {
  uploadArea: {
    border: '#E8E2DB',
    background: '#FFFFFF',
    hoverBorder: '#8B7355',
    hoverBackground: '#FAF8F5',
  },
  results: {
    background: '#FFFFFF',
    border: '#E8E2DB',
  },
  scores: {
    high: '#7B8E77',             // Sage green for good
    medium: '#D4A574',           // Warm honey for medium
    low: '#6B625A',              // Warm gray for low
  },
  authentication: {
    verified: '#7B8E77',         // Sage green checkmark
    uncertain: '#D4A574',        // Honey warning
    low: '#C26B5C',              // Terracotta alert
  },
}; 