import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generate a device fingerprint for tracking flip counts
 * This is a simple implementation - can be enhanced with more device characteristics
 */
export const generateDeviceFingerprint = async () => {
  try {
    // Check if we already have a stored fingerprint
    const storedFingerprint = await AsyncStorage.getItem('device_fingerprint');
    if (storedFingerprint) {
      return storedFingerprint;
    }
    
    // Generate new fingerprint
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const platform = Platform.OS;
    const version = Platform.Version;
    
    // For web, try to use more browser-specific info
    let browserInfo = '';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      browserInfo = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset()
      ].join('|');
    }
    
    // Create fingerprint
    const fingerprint = `fp_${platform}_${version}_${timestamp}_${random}`;
    
    // For web, create a hash of browser info if available
    if (browserInfo) {
      // Simple hash function for browser info
      let hash = 0;
      for (let i = 0; i < browserInfo.length; i++) {
        const char = browserInfo.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const browserHash = Math.abs(hash).toString(36);
      const webFingerprint = `fp_web_${browserHash}_${timestamp}`;
      
      // Store and return
      await AsyncStorage.setItem('device_fingerprint', webFingerprint);
      return webFingerprint;
    }
    
    // Store and return
    await AsyncStorage.setItem('device_fingerprint', fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Return a session-based fingerprint as fallback
    return `fp_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Get the stored device fingerprint or generate a new one
 */
export const getDeviceFingerprint = async () => {
  try {
    const fingerprint = await AsyncStorage.getItem('device_fingerprint');
    if (fingerprint) {
      return fingerprint;
    }
    return await generateDeviceFingerprint();
  } catch (error) {
    console.error('Error getting device fingerprint:', error);
    return await generateDeviceFingerprint();
  }
};

/**
 * Clear the device fingerprint (useful for testing)
 */
export const clearDeviceFingerprint = async () => {
  try {
    await AsyncStorage.removeItem('device_fingerprint');
  } catch (error) {
    console.error('Error clearing device fingerprint:', error);
  }
};