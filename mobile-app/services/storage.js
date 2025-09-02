// Storage service abstraction for native-ready architecture
// This service wraps localStorage for web and can easily be extended for AsyncStorage on native

import { Platform } from 'react-native';

const StorageService = {
  // Get item from storage
  get: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      // TODO: Native - Add AsyncStorage.getItem(key)
      return null;
    } catch (error) {
      console.error('StorageService.get error:', error);
      return null;
    }
  },

  // Set item in storage
  set: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return true;
      }
      // TODO: Native - Add AsyncStorage.setItem(key, value)
      return false;
    } catch (error) {
      console.error('StorageService.set error:', error);
      return false;
    }
  },

  // Remove item from storage
  remove: async (key) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return true;
      }
      // TODO: Native - Add AsyncStorage.removeItem(key)
      return false;
    } catch (error) {
      console.error('StorageService.remove error:', error);
      return false;
    }
  },

  // Clear all storage
  clear: async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
        return true;
      }
      // TODO: Native - Add AsyncStorage.clear()
      return false;
    } catch (error) {
      console.error('StorageService.clear error:', error);
      return false;
    }
  },

  // Get all keys (useful for debugging)
  getAllKeys: async () => {
    try {
      if (Platform.OS === 'web') {
        return Object.keys(localStorage);
      }
      // TODO: Native - Add AsyncStorage.getAllKeys()
      return [];
    } catch (error) {
      console.error('StorageService.getAllKeys error:', error);
      return [];
    }
  }
};

export default StorageService;