// Apple-style UI enhancements and microinteractions
import { brandColors } from './brandColors';

export const appleStyles = {
  // Typography refinements
  heading: {
    letterSpacing: -0.5,
    lineHeight: 1.1,
    fontWeight: '300', // Lighter weight for luxury feel
  },
  
  // Input focus styles
  inputFocus: {
    outline: 'none',
    borderColor: brandColors.accent,
    boxShadow: `0 0 0 2px rgba(0, 122, 255, 0.2)`,
  },
  
  // Button hover effects
  buttonHover: {
    transform: 'scale(1.01)',
    transition: 'all 0.2s ease',
  },
  
  // Subtle shadows for depth - React Native compatible
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  // Frosted glass effect (for mobile/overlay elements)
  frostedGlass: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    WebkitBackdropFilter: 'blur(10px)', // Safari support
  },
  
  // Icon styles for buttons
  iconStyle: {
    width: 20,
    height: 20,
    marginRight: 8,
    strokeWidth: 1.5, // Thin stroke for Apple aesthetic
  },
};