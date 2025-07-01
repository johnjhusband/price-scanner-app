import { Platform, StyleSheet } from 'react-native';

export const createPlatformStyles = (styles) => {
  const platformStyles = {};
  
  Object.keys(styles).forEach((key) => {
    const style = styles[key];
    
    if (typeof style === 'object' && style !== null) {
      // Check for platform-specific styles
      if (style.ios || style.android || style.web) {
        platformStyles[key] = {
          ...style,
          ...Platform.select({
            ios: style.ios || {},
            android: style.android || {},
            web: style.web || {},
          }),
        };
        
        // Remove platform keys from final style
        delete platformStyles[key].ios;
        delete platformStyles[key].android;
        delete platformStyles[key].web;
      } else {
        platformStyles[key] = style;
      }
    } else {
      platformStyles[key] = style;
    }
  });
  
  return StyleSheet.create(platformStyles);
};

// Common platform-specific shadow styles
export const shadowStyles = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
    },
  }),
  
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 5,
    },
    web: {
      boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
  }),
  
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.18)',
    },
  }),
};

// Platform-specific UI constants
export const platformConstants = {
  statusBarHeight: Platform.select({
    ios: 20,
    android: 0, // Android handles this automatically
    web: 0,
  }),
  
  tabBarHeight: Platform.select({
    ios: 49,
    android: 56,
    web: 48,
  }),
  
  headerHeight: Platform.select({
    ios: 44,
    android: 56,
    web: 48,
  }),
  
  buttonHeight: Platform.select({
    ios: 44,
    android: 48,
    web: 40,
  }),
  
  inputHeight: Platform.select({
    ios: 44,
    android: 48,
    web: 40,
  }),
  
  borderRadius: Platform.select({
    ios: 10,
    android: 4,
    web: 4,
  }),
  
  iconSize: {
    small: Platform.select({ ios: 20, android: 18, web: 18 }),
    medium: Platform.select({ ios: 24, android: 24, web: 20 }),
    large: Platform.select({ ios: 32, android: 32, web: 28 }),
  },
};

// Platform-specific animations
export const animationConfig = {
  timing: {
    duration: Platform.select({
      ios: 300,
      android: 250,
      web: 200,
    }),
  },
  
  spring: Platform.select({
    ios: {
      tension: 40,
      friction: 7,
    },
    android: {
      tension: 50,
      friction: 8,
    },
    web: {
      tension: 60,
      friction: 9,
    },
  }),
};

// Platform-specific haptic feedback
export const hapticFeedback = {
  impact: (style = 'light') => {
    if (Platform.OS === 'ios') {
      // Use expo-haptics for iOS
      const Haptics = require('expo-haptics');
      const impactStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(impactStyle[style] || impactStyle.light);
    } else if (Platform.OS === 'android') {
      // Use react-native's Vibration for Android
      const { Vibration } = require('react-native');
      const duration = {
        light: 10,
        medium: 20,
        heavy: 30,
      };
      Vibration.vibrate(duration[style] || duration.light);
    }
  },
  
  selection: () => {
    if (Platform.OS === 'ios') {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } else if (Platform.OS === 'android') {
      const { Vibration } = require('react-native');
      Vibration.vibrate(5);
    }
  },
  
  notification: (type = 'success') => {
    if (Platform.OS === 'ios') {
      const Haptics = require('expo-haptics');
      const notificationType = {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };
      Haptics.notificationAsync(notificationType[type] || notificationType.success);
    } else if (Platform.OS === 'android') {
      const { Vibration } = require('react-native');
      const pattern = {
        success: [0, 20, 50, 20],
        warning: [0, 30, 30, 30],
        error: [0, 50, 50, 50],
      };
      Vibration.vibrate(pattern[type] || pattern.success);
    }
  },
};