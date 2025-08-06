// Flippi.ai Brand Color System - Clean & Simple
// Focus on clarity, trust, and ease of use

export const brandColors = {
  // Core Colors - Timeless luxury palette inspired by Hermès
  primary: '#1E3A5F',           // Deep navy blue - trust & longevity
  text: '#0F1419',              // Almost black - maximum readability
  textSecondary: '#536471',     // Medium gray - subtle contrast
  background: '#FAFBFC',        // Cool white with hint of blue
  surface: '#FFFFFF',           // Pure white for cards
  border: '#E1E8ED',            // Light gray borders - refined
  
  // Accent Colors - Used sparingly
  success: '#1D9A6C',           // Refined green - sophisticated
  error: '#C13432',             // Hermès-inspired red - refined
  accent: '#4B7BEC',            // Bright blue - for key CTAs only
  accentLight: '#7BA7E7',       // Lighter blue accent
  
  // Legacy mappings for compatibility
  slateTeal: '#536471',         // Maps to textSecondary
  deepTeal: '#1E3A5F',          // Maps to primary
  softCream: '#FAFBFC',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#4B7BEC',         // Maps to accent (for CTAs)
  mutedGraphite: '#0F1419',     // Maps to text
  softTaupeBeige: '#E1E8ED',    // Maps to border
  
  // Additional legacy mappings
  soil: '#1A1A1A',              // Maps to text
  forest: '#1B5E5F',            // Maps to primary
  leaf: '#10B981',              // Maps to success
  honey: '#F59E0B',             // Remove - too many colors
  sunset: '#DC2626',            // Maps to error
  ocean: '#1B5E5F',             // Maps to primary
  cream: '#FAFAFA',             // Maps to background
  sand: '#FAFAFA',              // Maps to background
  stone: '#6B7280',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#1A1A1A',      // Maps to text
  lightGray: '#E5E7EB',         // Maps to border
  slateBlueGray: '#1B5E5F',     // Maps to primary
  actionPurple: '#1B5E5F',      // Maps to primary for CTA buttons
  actionPurpleHover: '#134E4F', // Darker teal for hover state
  successGreen: '#10B981',      // Maps to success
  
  // Semantic colors
  warning: '#F59E0B',           // Warning states only
  info: '#3B82F6',              // Info states only
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#1B5E5F',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#1B5E5F',          // Maps to primary
  
  // Focus states
  borderFocus: '#1B5E5F',       // Primary focus
  
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

// Button styling constants - Clean Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#1E3A5F',  // Deep navy blue
    color: '#FFFFFF',
    hoverBackground: '#152C48',  // Darker navy on hover
  },
  secondary: {
    backgroundColor: '#F7F9FA',  // Very light blue-gray
    color: '#1E3A5F',           // Navy text
    hoverBackground: '#E1E8ED', // Light gray on hover
    borderColor: '#CBD6E2',     // Blue-gray border
  },
  accent: {
    backgroundColor: '#4B7BEC',  // Bright blue accent
    color: '#FFFFFF', 
    hoverBackground: '#3A66D1',  // Darker blue on hover
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

// Component-specific colors - Clean & Simple
export const componentColors = {
  uploadArea: {
    border: '#E5E7EB',
    background: '#FFFFFF',
    hoverBorder: '#1B5E5F',
    hoverBackground: '#F9FAFB',
  },
  results: {
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
  scores: {
    high: '#10B981',             // Green for good
    medium: '#F59E0B',           // Orange for medium
    low: '#6B7280',              // Gray for low
  },
  authentication: {
    verified: '#10B981',         // Green checkmark
    uncertain: '#F59E0B',        // Orange warning
    low: '#DC2626',              // Red alert
  },
}; 