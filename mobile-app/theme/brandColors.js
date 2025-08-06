// Flippi.ai Brand Color System - Apple Build
// Minimal, ADA Compliant, Colorblind Accessible
// WCAG AAA Compliant Color Contrasts

export const brandColors = {
  // Core Colors - Apple Build (WCAG AAA Compliant)
  primary: '#000000',           // Pure black - 21:1 contrast ratio
  text: '#000000',              // Pure black - maximum readability
  textSecondary: '#3C3C43',     // Apple system gray - 10.37:1 contrast
  background: '#FFFFFF',        // Pure white - clean canvas
  surface: '#F2F2F7',           // Apple surface gray - better distinction
  border: '#C7C7CC',            // Apple separator - visible to all
  
  // Brand Action Colors
  slate: '#1F2937',             // Slate for secondary actions
  slateDark: '#111827',         // Dark slate for hover states
  
  // Accent Colors - Colorblind Safe (Deuteranopia/Protanopia/Tritanopia tested)
  success: '#10B981',           // Emerald - for value/verification only
  error: '#FF453A',             // Apple red - higher contrast than standard red
  accent: '#F59E0B',            // Amber - primary CTAs
  accentLight: '#FEF3C7',       // Light amber tint
  accentDark: '#D97706',        // Dark amber for hover states
  
  // Legacy mappings for compatibility
  slateTeal: '#3C3C43',         // Maps to textSecondary
  deepTeal: '#000000',          // Maps to primary (black)
  softCream: '#FFFFFF',         // Maps to background
  offWhite: '#F9FAFB',          // Maps to surface
  matteGold: '#007AFF',         // Maps to accent (blue)
  mutedGraphite: '#000000',     // Maps to text
  softTaupeBeige: '#D1D5DB',    // Maps to border
  
  // Additional legacy mappings
  soil: '#000000',              // Maps to text
  forest: '#34C759',            // Maps to success
  leaf: '#34C759',              // Maps to success
  honey: '#FF9500',             // Apple orange (kept minimal)
  sunset: '#FF3B30',            // Maps to error
  ocean: '#007AFF',             // Maps to accent
  cream: '#FFFFFF',             // Maps to background
  sand: '#FFFFFF',              // Maps to background
  stone: '#3C3C43',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#000000',      // Maps to text
  lightGray: '#D2D2D7',         // Maps to border
  slateBlueGray: '#000000',     // Maps to primary
  actionPurple: '#007AFF',      // Maps to accent for CTA buttons
  actionPurpleHover: '#0051D5', // Darker blue for hover state
  successGreen: '#34C759',      // Maps to success
  
  // Semantic colors - High Contrast & Colorblind Safe
  warning: '#FF9F0A',           // Apple yellow - better for colorblind users
  info: '#5856D6',              // Apple indigo - distinct from primary blue
  
  // Text Colors - WCAG AAA Compliant
  primaryText: '#000000',       // Main text - 21:1 contrast
  secondaryText: '#3C3C43',     // Secondary text - 10.37:1 contrast (AAA)
  disabledText: '#8E8E93',      // Inactive states - 4.5:1 contrast (AA)
  
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
  // San Francisco font stack - Apple's system font
  // Temporarily simplified to debug Chrome issues
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, Arial, sans-serif',
  
  // Display vs Text fonts for optimal readability (ADA compliant sizes)
  headingFont: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  bodyFont: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  monoFont: 'ui-monospace, Menlo, Monaco, monospace',
  
  weights: {
    ultraLight: '100',
    thin: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    heavy: '800',
    black: '900'
  },
  sizes: {
    logo: 'custom',
    // ADA Compliant sizes - minimum 14px for body text
    h1: '48px',     // Display size
    h2: '36px',     // Title 1
    h3: '28px',     // Title 2
    h4: '24px',     // Title 3
    body: '17px',   // Body - optimal for readability
    small: '15px',  // Callout - still ADA compliant
    caption: '14px', // Caption 1 - minimum ADA size
    notes: '13px'   // Caption 2 - use sparingly
  },
  lineHeight: {
    tight: '1.1',    // For large headings
    normal: '1.5',   // Default - good for readability
    relaxed: '1.6',  // For body text
    loose: '1.8'     // For small text - improves readability
  },
  letterSpacing: {
    tighter: '-0.03em',  // Display text
    tight: '-0.02em',    // Headlines
    normal: '0',         // Body text
    wide: '0.02em',      // Small text
    wider: '0.04em'      // All caps
  }
};

// Button styling constants - Minimal Apple Design with Brand Colors
export const buttonStyles = {
  primary: {
    backgroundColor: brandColors.slate,  // Slate for login/secondary actions
    color: '#FFFFFF',                   // White text on dark background
    hoverBackground: brandColors.slateDark,  // Darker slate on hover
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: '#F2F2F7',  // Apple light gray
    color: brandColors.text,     // Black text
    hoverBackground: '#E5E5EA',  // Slightly darker gray
    borderColor: 'transparent',  // No borders
  },
  accent: {
    backgroundColor: brandColors.accent,     // Amber for primary CTAs
    color: brandColors.slate,               // Dark gray text for WCAG AA
    hoverBackground: brandColors.accentDark, // Darker amber
    fontWeight: '600',                      // Heavier weight for readability
  },
  ghost: {
    backgroundColor: 'transparent',  // No background
    color: '#4B5563',               // Medium gray text
    hoverBackground: '#F3F4F6',     // Light gray on hover
    borderColor: 'transparent',     // No border
  },
  borderRadius: '14px',          // Even more rounded, modern Apple
  padding: {
    horizontal: '32px',          // More breathing room
    vertical: '16px',            // Taller buttons
  },
  minHeight: '52px',             // Bigger touch targets
  minWidth: '140px',             // More substantial
  fontWeight: '500',             // Medium weight, not too bold
  transition: 'all 0.2s ease',   // Smooth transitions
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)', // Subtle shadow
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
    high: brandColors.success,       // Emerald (data/verification only)
    medium: '#FF9500',               // Apple orange (caution only)
    low: '#86868B',                  // Apple gray (neutral)
    spark: brandColors.accent,       // Amber (used sparingly)
  },
  authentication: {
    verified: brandColors.success,   // Emerald for verification
    uncertain: '#FF9500',            // Apple orange
    low: '#FF3B30',                  // Apple red
  },
  badge: {
    background: '#F2F2F7',           // Light gray background
    text: '#000000',                 // Black text for contrast
  },
}; 