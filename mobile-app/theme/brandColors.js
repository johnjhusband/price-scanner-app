// Flippi.ai Brand Color System
// Luxury Minimalistic Color Palette

export const brandColors = {
  // Primary Brand Colors
  slateTeal: '#3F5954',         // Primary UI color, icons, text on light backgrounds
  deepTeal: '#1D5C5A',          // Buttons, headers, call-to-action components
  softCream: '#F3EFEA',         // Backgrounds, sections, secondary UI fill
  offWhite: '#FBF8F2',          // Secondary background and form areas
  matteGold: '#C8A863',         // Accent text, highlights, subtle luxury touches
  mutedGraphite: '#1E2A28',     // Body text, footer, logo variants
  softTaupeBeige: '#D6C6B5',    // Secondary UI elements, shadows, neutral backgrounds
  
  // Legacy color mappings (for compatibility)
  charcoalGray: '#1E2A28',      // Maps to mutedGraphite
  lightGray: '#D6C6B5',         // Maps to softTaupeBeige
  slateBlueGray: '#3F5954',     // Maps to slateTeal
  actionPurple: '#1D5C5A',      // Maps to deepTeal for CTA buttons
  actionPurpleHover: '#174B49', // Darker teal for hover state
  successGreen: '#3F5954',      // Maps to slateTeal for success
  
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
  primary: '#1D5C5A',           // Primary action color
};

export const typography = {
  fontFamily: 'Poppins, sans-serif',
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700'
  },
  sizes: {
    logo: 'custom',
    h1: '36px',
    h2: '28px',
    h3: '24px',
    body: '16px',
    small: '14px',
    notes: '12px'
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
  borderRadius: '8px',
  padding: {
    horizontal: '24px',
    vertical: '12px',
  },
  minHeight: '48px',
  minWidth: '120px',
};

// Component-specific colors
export const componentColors = {
  uploadArea: {
    border: brandColors.softTaupeBeige,
    background: brandColors.softCream,
    hoverBorder: brandColors.deepTeal,
    hoverBackground: brandColors.offWhite,
  },
  results: {
    background: brandColors.softCream,
    border: brandColors.softTaupeBeige,
  },
  scores: {
    high: brandColors.slateTeal,
    medium: brandColors.matteGold,
    low: brandColors.softTaupeBeige,
  },
}; 