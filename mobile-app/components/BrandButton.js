import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { brandColors, typography, buttonStyles } from '../theme/brandColors';

export const BrandButton = ({ 
  title, 
  variant = 'primary', // 'primary', 'secondary', 'accent', 'ghost'
  onPress, 
  disabled = false,
  style,
  textStyle,
  isHighImpact = false // For CTA buttons like 'Go' or 'Scan Now'
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return [styles.button, styles.disabledButton, style];
    }
    
    if (variant === 'primary') {
      return [styles.button, styles.primaryButton, style];
    } else if (variant === 'accent' || isHighImpact) {
      return [styles.button, styles.accentButton, style];
    } else if (variant === 'ghost') {
      return [styles.button, styles.ghostButton, style];
    } else {
      return [styles.button, styles.secondaryButton, style];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return [styles.buttonText, styles.disabledText, textStyle];
    }
    
    if (variant === 'primary') {
      return [styles.buttonText, styles.primaryText, textStyle];
    } else if (variant === 'accent' || isHighImpact) {
      return [styles.buttonText, styles.accentText, textStyle];
    } else if (variant === 'ghost') {
      return [styles.buttonText, styles.ghostText, textStyle];
    } else {
      return [styles.buttonText, styles.secondaryText, textStyle];
    }
  };

  return (
    <TouchableOpacity 
      style={getButtonStyle()} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14, // Modern Apple style
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 140,
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  primaryButton: {
    backgroundColor: buttonStyles.primary.backgroundColor,
    borderWidth: buttonStyles.primary.borderWidth || 0,
    borderColor: buttonStyles.primary.borderColor || 'transparent',
  },
  secondaryButton: {
    backgroundColor: buttonStyles.secondary.backgroundColor,
    borderWidth: 1,
    borderColor: buttonStyles.secondary.borderColor || brandColors.border,
  },
  accentButton: {
    backgroundColor: buttonStyles.accent.backgroundColor,
  },
  ghostButton: {
    backgroundColor: (buttonStyles.ghost && buttonStyles.ghost.backgroundColor) || 'transparent',
    borderWidth: 0,
  },
  disabledButton: {
    backgroundColor: brandColors.disabledText,
  },
  buttonText: {
    fontFamily: typography.bodyFont,
    fontWeight: buttonStyles.fontWeight || typography.weights.semiBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  primaryText: {
    color: buttonStyles.primary.color,
  },
  secondaryText: {
    color: buttonStyles.secondary.color,
  },
  accentText: {
    color: buttonStyles.accent.color,
  },
  ghostText: {
    color: (buttonStyles.ghost && buttonStyles.ghost.color) || brandColors.textSecondary,
  },
  disabledText: {
    color: brandColors.disabledText,
  },
});

export default BrandButton; 