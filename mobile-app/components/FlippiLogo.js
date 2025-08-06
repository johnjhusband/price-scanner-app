import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { brandColors, typography } from '../theme/brandColors';

export const FlippiLogo = ({ size = 'large', style }) => {
  const sizeStyles = {
    small: { fontSize: 20 },
    medium: { fontSize: 24 },
    large: { fontSize: 32 },
    xlarge: { fontSize: 40 },
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
    color: brandColors.mutedGraphite,  // Updated to new luxury color
  },
  aiText: {
    fontWeight: typography.weights.regular,
    color: brandColors.textSecondary,  // Slate gray for subtle contrast
  },
});

export default FlippiLogo; 