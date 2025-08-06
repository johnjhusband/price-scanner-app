// Flippi.ai Brand Color System - Minimal & Sophisticated
// Apple-inspired design: Let typography and spacing speak, not colors

export const brandColors = {
  // Core Colors - Crisp black and white
  primary: '#000000',           // Pure black - confident, minimal
  text: '#000000',              // Pure black - maximum contrast
  textSecondary: '#86868B',     // Apple gray - subtle hierarchy
  background: '#FFFFFF',        // Pure white - clean canvas
  surface: '#FFFFFF',           // Pure white for cards
  border: '#D2D2D7',            // Apple light gray - barely there
  
  // Accent Colors - Minimal and purposeful
  success: '#34C759',           // Apple green - only for success
  error: '#FF3B30',             // Apple red - only for errors
  accent: '#007AFF',            // Apple blue - primary actions only
  accentLight: '#E5F1FF',       // Very light blue tint
  
  // Legacy mappings for compatibility
  slateTeal: '#86868B',         // Maps to textSecondary
  deepTeal: '#000000',          // Maps to primary (black)
  softCream: '#FFFFFF',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#007AFF',         // Maps to accent (blue)
  mutedGraphite: '#000000',     // Maps to text
  softTaupeBeige: '#D2D2D7',    // Maps to border
  
  // Additional legacy mappings
  soil: '#000000',              // Maps to text
  forest: '#34C759',            // Maps to success
  leaf: '#34C759',              // Maps to success
  honey: '#FF9500',             // Apple orange (kept minimal)
  sunset: '#FF3B30',            // Maps to error
  ocean: '#007AFF',             // Maps to accent
  cream: '#FFFFFF',             // Maps to background
  sand: '#FFFFFF',              // Maps to background
  stone: '#86868B',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#000000',      // Maps to text
  lightGray: '#D2D2D7',         // Maps to border
  slateBlueGray: '#000000',     // Maps to primary
  actionPurple: '#007AFF',      // Maps to accent for CTA buttons
  actionPurpleHover: '#0051D5', // Darker blue for hover state
  successGreen: '#34C759',      // Maps to success
  
  // Semantic colors
  warning: '#FF9500',           // Apple orange for warnings
  info: '#007AFF',              // Apple blue for info
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#000000',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#007AFF',          // Maps to accent (blue)
  
  // Focus states
  borderFocus: '#007AFF',       // Primary focus (blue)
  
  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const typography = {
  // Apple-style typography - let the fonts do the work
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
  
  // Display vs Text fonts for optimal readability
  headingFont: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
  bodyFont: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
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
    h1: '48px',     // Bigger, bolder
    h2: '36px',     // More hierarchy
    h3: '28px',     // Clear distinction
    body: '17px',   // Optimal readability
    small: '15px',  // Still readable
    notes: '13px'   // Minimum size
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.8'
  }
};

// Button styling constants - Minimal Apple Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#FFFFFF',  // White background
    color: '#007AFF',           // Blue text for friendlier feel
    hoverBackground: '#F2F2F7',  // Light gray on hover
    borderWidth: 1.5,           // Slightly thicker border
    borderColor: '#007AFF',     // Blue border to match text
  },
  secondary: {
    backgroundColor: '#F2F2F7',  // Apple light gray
    color: '#000000',           // Black text
    hoverBackground: '#E5E5EA', // Slightly darker gray
    borderColor: 'transparent', // No borders
  },
  accent: {
    backgroundColor: '#007AFF',  // Apple blue for key CTAs only
    color: '#FFFFFF', 
    hoverBackground: '#0051D5',  // Darker blue
  },
  ghost: {
    backgroundColor: 'transparent',  // No background
    color: '#4B5563',               // Medium gray text
    hoverBackground: '#F3F4F6',     // Light gray on hover
    borderColor: 'transparent',     // No border
  },
  borderRadius: '12px',          // More rounded, Apple-style
  padding: {
    horizontal: '32px',          // More breathing room
    vertical: '16px',            // Taller buttons
  },
  minHeight: '52px',             // Bigger touch targets
  minWidth: '140px',             // More substantial
  fontWeight: '500',             // Medium weight, not too bold
};

// Component-specific colors - Minimal Apple Design
export const componentColors = {
  uploadArea: {
    border: '#D2D2D7',               // Subtle gray border
    background: '#FFFFFF',           // White
    hoverBorder: '#000000',          // Black on hover
    hoverBackground: '#F2F2F7',      // Subtle gray tint
  },
  results: {
    background: '#FFFFFF',
    border: '#D2D2D7',
  },
  scores: {
    high: '#34C759',                 // Apple green (success only)
    medium: '#FF9500',               // Apple orange (caution only)
    low: '#86868B',                  // Apple gray (neutral)
    spark: '#007AFF',                // Blue (used sparingly)
  },
  authentication: {
    verified: '#34C759',             // Apple green
    uncertain: '#FF9500',            // Apple orange
    low: '#FF3B30',                  // Apple red
  },
  badge: {
    background: '#F2F2F7',           // Light gray background
    text: '#000000',                 // Black text for contrast
  },
}; 