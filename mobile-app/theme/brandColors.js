// Flippi.ai Brand Color System
// Based on comprehensive brand guide

export const brandColors = {
  // Primary Brand Colors
  charcoalGray: '#23292C',      // Logo "flippi", headlines, buttons
  lightGray: '#BFC2C4',         // ".ai", subtitles, icon dot
  slateBlueGray: '#4A5A5F',     // App background, icon fill
  
  // Accent & Background Colors
  coolWhite: '#F5F6F7',         // Backgrounds, cards, CTA areas
  actionBlue: '#3478F6',        // CTA buttons
  actionBlueHover: '#2C68D0',   // Button hover state
  successGreen: '#3C8C4E',      // Resale value success highlight
  
  // Text Colors
  primaryText: '#23292C',       // Main text
  secondaryText: '#495A5C',     // Notes, smaller UI
  disabledText: '#D1D3D4',      // Inactive states
  
  // Favicon Background
  faviconBg: '#4A5A5F',         // Favicon background color
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
    backgroundColor: brandColors.actionBlue,
    color: '#FFFFFF',
    hoverBackground: brandColors.actionBlueHover,
  },
  secondary: {
    backgroundColor: brandColors.lightGray,
    color: brandColors.charcoalGray,
    hoverBackground: '#A5A8AA',
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
    border: brandColors.lightGray,
    background: brandColors.coolWhite,
    hoverBorder: brandColors.actionBlue,
    hoverBackground: '#F0F4FF',
  },
  results: {
    background: '#F0F0F0',
    border: brandColors.lightGray,
  },
  scores: {
    high: brandColors.successGreen,
    medium: '#F57C00',
    low: '#D32F2F',
  },
}; 