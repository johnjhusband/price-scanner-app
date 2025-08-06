// Flippi.ai Brand Color System - Modern & Sophisticated
// Deep navy and steel gray with strategic color pops - current interior design trends

export const brandColors = {
  // Core Colors - Contemporary navy and steel palette
  primary: '#1F2937',           // Deep charcoal navy - sophisticated, modern
  text: '#111827',              // Almost black - crisp and clean
  textSecondary: '#6B7280',     // Steel gray - neutral contrast
  background: '#FAFBFC',        // Cool white with hint of blue
  surface: '#FFFFFF',           // Pure white for cards
  border: '#E5E7EB',            // Light steel gray borders
  
  // Accent Colors - Strategic pops of color
  success: '#10B981',           // Emerald green - vibrant but professional
  error: '#EF4444',             // True red - clear communication
  accent: '#F59E0B',            // Amber - warm pop of color for CTAs
  accentLight: '#FCD34D',       // Light amber
  
  // Legacy mappings for compatibility
  slateTeal: '#6B7280',         // Maps to textSecondary
  deepTeal: '#1F2937',          // Maps to primary (navy)
  softCream: '#FAFBFC',         // Maps to background
  offWhite: '#FFFFFF',          // Maps to surface
  matteGold: '#F59E0B',         // Maps to accent (amber)
  mutedGraphite: '#111827',     // Maps to text
  softTaupeBeige: '#E5E7EB',    // Maps to border
  
  // Additional legacy mappings
  soil: '#111827',              // Maps to text
  forest: '#10B981',            // Maps to emerald green
  leaf: '#10B981',              // Maps to success
  honey: '#F59E0B',             // Maps to amber accent
  sunset: '#EF4444',            // Maps to error
  ocean: '#1F2937',             // Maps to primary
  cream: '#FAFBFC',             // Maps to background
  sand: '#FAFBFC',              // Maps to background
  stone: '#6B7280',             // Maps to textSecondary
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#111827',      // Maps to text
  lightGray: '#E5E7EB',         // Maps to border
  slateBlueGray: '#1F2937',     // Maps to primary
  actionPurple: '#1F2937',      // Maps to primary for CTA buttons
  actionPurpleHover: '#111827', // Darker navy for hover state
  successGreen: '#10B981',      // Maps to success
  
  // Semantic colors
  warning: '#F59E0B',           // Amber for warnings
  info: '#3B82F6',              // Bright blue for info
  
  // Text Colors
  primaryText: '#1A1A1A',       // Main text
  secondaryText: '#6B7280',     // Secondary text
  disabledText: '#D1D5DB',      // Inactive states
  
  // Favicon Background
  faviconBg: '#1F2937',         // Favicon background color (primary)
  
  // Keep these for backward compatibility
  electric: '#1F2937',          // Maps to primary
  
  // Focus states
  borderFocus: '#1F2937',       // Primary focus
  
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

// Button styling constants - Modern Design
export const buttonStyles = {
  primary: {
    backgroundColor: '#1F2937',  // Deep charcoal navy
    color: '#FFFFFF',
    hoverBackground: '#111827',  // Darker navy
  },
  secondary: {
    backgroundColor: '#F3F4F6',  // Light steel gray
    color: '#1F2937',           // Navy text
    hoverBackground: '#E5E7EB', // Slightly darker gray
    borderColor: '#D1D5DB',     // Steel border
  },
  accent: {
    backgroundColor: '#F59E0B',  // Amber pop for special CTAs
    color: '#FFFFFF', 
    hoverBackground: '#D97706',  // Darker amber
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

// Component-specific colors - Modern & Clean
export const componentColors = {
  uploadArea: {
    border: '#E5E7EB',
    background: '#FFFFFF',
    hoverBorder: '#1F2937',
    hoverBackground: '#F9FAFB',
  },
  results: {
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
  scores: {
    high: '#10B981',             // Emerald for good
    medium: '#F59E0B',           // Amber for medium
    low: '#6B7280',              // Steel gray for low
  },
  authentication: {
    verified: '#10B981',         // Emerald checkmark
    uncertain: '#F59E0B',        // Amber warning
    low: '#EF4444',              // Red alert
  },
}; 