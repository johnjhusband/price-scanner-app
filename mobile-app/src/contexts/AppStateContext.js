import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

const AppStateContext = createContext({});

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState(null);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    compressImages: true,
    autoSaveScans: true,
    notifications: true,
    analyticsEnabled: false,
  });
  const [deviceInfo, setDeviceInfo] = useState({});
  const [pendingActions, setPendingActions] = useState([]);

  // Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      setNetworkType(state.type);
      
      // Process pending actions when back online
      if (state.isConnected && pendingActions.length > 0) {
        processPendingActions();
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected);
      setNetworkType(state.type);
    });

    return unsubscribe;
  }, [pendingActions]);

  // Load preferences on app start
  useEffect(() => {
    loadPreferences();
    gatherDeviceInfo();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('app_preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences) => {
    try {
      const updated = { ...preferences, ...newPreferences };
      await AsyncStorage.setItem('app_preferences', JSON.stringify(updated));
      setPreferences(updated);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const gatherDeviceInfo = async () => {
    try {
      const info = {
        brand: Device.brand,
        model: Device.modelName,
        os: Device.osName,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        isDevice: Device.isDevice,
        appVersion: Application.nativeApplicationVersion,
        buildVersion: Application.nativeBuildVersion,
      };
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error gathering device info:', error);
    }
  };

  const addPendingAction = async (action) => {
    const newAction = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action,
    };
    
    const updated = [...pendingActions, newAction];
    setPendingActions(updated);
    
    // Persist to storage
    try {
      await AsyncStorage.setItem('pending_actions', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving pending action:', error);
    }
  };

  const processPendingActions = async () => {
    if (pendingActions.length === 0) return;

    const remaining = [];
    
    for (const action of pendingActions) {
      try {
        // Process action based on type
        switch (action.type) {
          case 'scan':
            // Retry scan upload
            await action.handler();
            break;
          case 'sync':
            // Sync data
            await action.handler();
            break;
          default:
            console.warn('Unknown pending action type:', action.type);
        }
      } catch (error) {
        console.error('Error processing pending action:', error);
        remaining.push(action);
      }
    }

    setPendingActions(remaining);
    
    // Update storage
    try {
      if (remaining.length > 0) {
        await AsyncStorage.setItem('pending_actions', JSON.stringify(remaining));
      } else {
        await AsyncStorage.removeItem('pending_actions');
      }
    } catch (error) {
      console.error('Error updating pending actions:', error);
    }
  };

  const clearCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  };

  const value = {
    // Network state
    isOnline,
    networkType,
    
    // Preferences
    preferences,
    savePreferences,
    
    // Device info
    deviceInfo,
    
    // Offline support
    pendingActions,
    addPendingAction,
    processPendingActions,
    
    // Utilities
    clearCache,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};