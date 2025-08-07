// Flippi.ai Typography Guide
// Standardized typography rules across all views

import { Dimensions } from 'react-native';

const { width: windowWidth } = Dimensions.get('window');
const isMobile = windowWidth < 768;

export const typographyStyles = {
  // Brand Logo
  logo: {
    mobile: 32,
    desktop: 40,
    letterSpacing: -0.5,
    colors: {
      flippi: '#000000',
      ai: '#6E6E76', // Consistent brand gray
    }
  },

  // Primary Tagline (Never Over Pay)
  tagline: {
    fontSize: isMobile ? 24 : 28,
    fontWeight: '700', // Bold
    lineHeight: 1.2,
    color: '#000000',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },

  // Subtext (Know the price. Own the profit.)
  subtext: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '400', // Normal
    color: '#6E6E76', // Same as .ai
    maxWidth: isMobile ? '100%' : '80%',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Responsive breakpoints for testing
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
  },

  // Vertical spacing guide
  spacing: {
    betweenElements: 12, // Standard spacing between typography elements
    sectionPadding: {
      mobile: 16,
      desktop: 40,
    }
  }
};

export default typographyStyles;