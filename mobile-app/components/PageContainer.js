import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

const { width: windowWidth } = Dimensions.get('window');

// Breakpoints to match Tailwind-like responsive behavior
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Determine current screen size category
const getScreenSize = () => {
  if (windowWidth >= BREAKPOINTS.xl) return 'xl';
  if (windowWidth >= BREAKPOINTS.lg) return 'lg';
  if (windowWidth >= BREAKPOINTS.md) return 'md';
  if (windowWidth >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

const PageContainer = ({ children, style, className }) => {
  const screenSize = getScreenSize();
  
  // Responsive padding based on screen size
  const getPadding = () => {
    switch (screenSize) {
      case 'xl':
      case 'lg':
        return 48; // lg:px-12 equivalent
      case 'md':
        return 24; // sm:px-6 equivalent
      default:
        return 16; // px-4 equivalent
    }
  };

  // Max width for desktop (max-w-4xl = 896px)
  const getMaxWidth = () => {
    if (Platform.OS === 'web' && windowWidth > BREAKPOINTS.md) {
      return 896; // max-w-4xl equivalent
    }
    return '100%';
  };

  const containerStyle = [
    styles.container,
    {
      paddingHorizontal: getPadding(),
      maxWidth: getMaxWidth(),
    },
    style,
  ];

  // For web, add className support for additional styling
  if (Platform.OS === 'web' && className) {
    return (
      <div 
        className={`w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});

export default PageContainer;