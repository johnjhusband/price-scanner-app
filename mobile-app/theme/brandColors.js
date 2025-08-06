// Flippi.ai Brand Color System - Modern, Clean & Playfully Bold
// Contemporary base with hyperpop accents for memorable brand experience

export const brandColors = {
  // Core Colors - Clean base with bold accents
  primary: '#7C3AED',           // Hyperpop purple - bold, memorable, modern
  text: '#111827',              // Almost black - crisp and clean
  textSecondary: '#6B7280',     // Slate gray - neutral contrast
  background: '#FAFBFC',        // Cool white with hint of blue
  surface: '#FFFFFF',           // Pure white for cards
  border: '#E5E7EB',            // Light cool gray borders
  
  // Accent Colors - Playful pops of color
  success: '#10B981',           // Emerald - confidence and trust
  error: '#EF4444',             // True red - clear communication
  accent: '#EC4899',            // Electric pink - energy and flair
  accentLight: '#FBCFE8',       // Light pink
  
  // Legacy mappings for compatibility
  slateTeal: '#6B7280',         // Maps to textSecondary
  deepTeal: '#7C3AED',          // Maps to primary (purple)
  softCream: '#FAFBFC',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#EC4899',         // Maps to accent (pink)
  mutedGraphite: '#111827',     // Maps to text
  softTaupeBeige: '#E5E7EB',    // Maps to border
  
  // Additional legacy mappings
  soil: '#111827',              // Maps to text
  forest: '#10B981',            // Maps to emerald green
  leaf: '#10B981',              // Maps to success
  honey: '#F59E0B',             // Amber (kept for compatibility)
  sunset: '#EF4444',            // Maps to error
  ocean: '#7C3AED',             // Maps to primary
  cream: '#FAFBFC',             // Maps to background
  sand: '#FAFBFC',              // Maps to background
  stone: '#6B7280',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#111827',      // Maps to text
  lightGray: '#E5E7EB',         // Maps to border
  slateBlueGray: '#7C3AED',     // Maps to primary
  actionPurple: '#7C3AED',      // Maps to primary for CTA buttons
  actionPurpleHover: '#6D28D9', // Darker purple for hover state
  successGreen: '#10B981',      // Maps to success
  
  // Semantic colors
  warning: '#F59E0B',           // Amber for warnings
  info: '#0284C7',              // Blue for info (matches badge)
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#7C3AED',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#EC4899',          // Maps to accent (pink)
  
  // Focus states
  borderFocus: '#7C3AED',       // Primary focus
  
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

// Button styling constants - Playfully Bold Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#7C3AED',  // Hyperpop purple
    color: '#FFFFFF',
    hoverBackground: '#6D28D9',  // Darker purple
  },
  secondary: {
    backgroundColor: '#F3F4F6',  // Light gray
    color: '#111827',           // Almost black text
    hoverBackground: '#E5E7EB', // Slightly darker gray
    borderColor: '#D1D5DB',     // Gray border
  },
  accent: {
    backgroundColor: '#EC4899',  // Electric pink for special CTAs
    color: '#FFFFFF', 
    hoverBackground: '#DB2777',  // Darker pink
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

// Component-specific colors - Modern, Clean, & Playfully Bold
export const componentColors = {
  uploadArea: {
    border: '#E5E7EB',               // Light cool gray (neutral base)
    background: '#FFFFFF',           // White
    hoverBorder: '#7C3AED',          // Hyperpop purple punch
    hoverBackground: '#F5F3FF',      // Lavender haze (subtle contrast)
  },
  results: {
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
  scores: {
    high: '#10B981',                 // Emerald (confidence)
    medium: '#F59E0B',               // Amber (caution)
    low: '#6B7280',                  // Slate gray (neutral low)
    spark: '#EC4899',                // Electric pink (optional for highlight or flair)
  },
  authentication: {
    verified: '#10B981',             // Trusted green
    uncertain: '#F59E0B',            // Amber warning
    low: '#EF4444',                  // Red alert
  },
  badge: {
    background: '#E0F2FE',           // Soft blue for contrast
    text: '#0284C7',                 // Blue callout (e.g., for limited offers or new scans)
  },
}; 