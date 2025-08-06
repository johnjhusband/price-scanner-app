import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { brandColors, typography } from '../theme/brandColors';

const { width: windowWidth } = Dimensions.get('window');
const isMobile = windowWidth < 768;

export const FlippiLogo = ({ size = 'large', style, responsive = true }) => {
  const sizeStyles = {
    small: { fontSize: 20 },
    medium: { fontSize: 24 },
    large: { fontSize: responsive && isMobile ? 32 : 40 },
    xlarge: { fontSize: responsive && isMobile ? 32 : 40 },
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[
        styles.logoText, 
        styles.flippiText, 
        sizeStyles[size]
      ]}>
        flippi
      </Text>
      <Text style={[
        styles.logoText, 
        styles.aiText, 
        sizeStyles[size]
      ]}>
        .ai
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: typography.fontFamily,
  },
  flippiText: {
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,  // Pure black
  },
  aiText: {
    fontWeight: typography.weights.regular,
    color: brandColors.aiGray,  // Official .ai brand gray
  },
});

export default FlippiLogo; 