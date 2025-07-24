import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { brandColors, typography, buttonStyles } from '../theme/brandColors';

export const BrandButton = ({ 
  title, 
  variant = 'primary', 
  onPress, 
  disabled = false,
  style,
  textStyle
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return [styles.button, styles.disabledButton, style];
    }
    
    if (variant === 'primary') {
      return [styles.button, styles.primaryButton, style];
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
      <Text style={getTextStyle()}>{title.toUpperCase()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: parseInt(buttonStyles.padding.horizontal),
    paddingVertical: parseInt(buttonStyles.padding.vertical),
    borderRadius: 12, // Increased from 8px for more modern look
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: parseInt(buttonStyles.minHeight),
    minWidth: parseInt(buttonStyles.minWidth),
    // Removed shadows for flat design
  },
  primaryButton: {
    backgroundColor: buttonStyles.primary.backgroundColor,
  },
  secondaryButton: {
    backgroundColor: buttonStyles.secondary.backgroundColor,
  },
  disabledButton: {
    backgroundColor: brandColors.disabledText,
  },
  buttonText: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.semiBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  primaryText: {
    color: buttonStyles.primary.color,
  },
  secondaryText: {
    color: buttonStyles.secondary.color,
  },
  disabledText: {
    color: brandColors.disabledText,
  },
});

export default BrandButton; 