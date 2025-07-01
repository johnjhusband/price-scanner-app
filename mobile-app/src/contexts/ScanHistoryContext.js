import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';

const ScanHistoryContext = createContext({});

export const useScanHistory = () => {
  const context = useContext(ScanHistoryContext);
  if (!context) {
    throw new Error('useScanHistory must be used within ScanHistoryProvider');
  }
  return context;
};

export const ScanHistoryProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, addPendingAction } = useAppState();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    platform: null,
    minPrice: null,
    maxPrice: null,
    dateRange: null,
  });

  // Local storage key
  const SCAN_HISTORY_KEY = 'scan_history_local';

  // Load scan history when user changes
  useEffect(() => {
    if (isAuthenticated) {
      loadScans();
    } else {
      loadLocalScans();
    }
  }, [isAuthenticated, user?.id]);

  const loadScans = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAuthenticated && isOnline) {
        // Load from server
        const response = await apiService.get('/scan/history');
        const serverScans = response.data.data || [];
        setScans(serverScans);
        
        // Cache locally
        await AsyncStorage.setItem(
          SCAN_HISTORY_KEY,
          JSON.stringify(serverScans)
        );
      } else {
        // Load from local cache
        await loadLocalScans();
      }
    } catch (error) {
      console.error('Error loading scans:', error);
      setError('Failed to load scan history');
      // Fall back to local cache
      await loadLocalScans();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalScans = async () => {
    try {
      const localScans = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
      if (localScans) {
        setScans(JSON.parse(localScans));
      }
    } catch (error) {
      console.error('Error loading local scans:', error);
    }
  };

  const addScan = async (scanData) => {
    try {
      const newScan = {
        id: `scan_${Date.now()}`,
        ...scanData,
        userId: user?.id,
        scannedAt: new Date().toISOString(),
        synced: false,
      };

      // Add to local state immediately
      const updatedScans = [newScan, ...scans];
      setScans(updatedScans);
      
      // Save locally
      await AsyncStorage.setItem(
        SCAN_HISTORY_KEY,
        JSON.stringify(updatedScans)
      );

      if (isAuthenticated && isOnline) {
        // Try to sync with server
        try {
          const response = await apiService.post('/scan', scanData);
          // Update with server response
          const serverScan = response.data.data;
          const syncedScans = updatedScans.map(scan =>
            scan.id === newScan.id ? { ...serverScan, synced: true } : scan
          );
          setScans(syncedScans);
          await AsyncStorage.setItem(
            SCAN_HISTORY_KEY,
            JSON.stringify(syncedScans)
          );
        } catch (error) {
          console.error('Error syncing scan:', error);
          // Add to pending actions for later sync
          await addPendingAction({
            type: 'scan',
            data: scanData,
            handler: async () => {
              return apiService.post('/scan', scanData);
            },
          });
        }
      }

      return { success: true, scan: newScan };
    } catch (error) {
      console.error('Error adding scan:', error);
      setError('Failed to save scan');
      return { success: false, error: 'Failed to save scan' };
    }
  };

  const updateScan = async (scanId, updates) => {
    try {
      const updatedScans = scans.map(scan =>
        scan.id === scanId ? { ...scan, ...updates } : scan
      );
      setScans(updatedScans);
      
      // Save locally
      await AsyncStorage.setItem(
        SCAN_HISTORY_KEY,
        JSON.stringify(updatedScans)
      );

      if (isAuthenticated && isOnline) {
        // Sync with server
        await apiService.put(`/scan/${scanId}`, updates);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating scan:', error);
      return { success: false, error: 'Failed to update scan' };
    }
  };

  const deleteScan = async (scanId) => {
    try {
      const updatedScans = scans.filter(scan => scan.id !== scanId);
      setScans(updatedScans);
      
      // Save locally
      await AsyncStorage.setItem(
        SCAN_HISTORY_KEY,
        JSON.stringify(updatedScans)
      );

      if (isAuthenticated && isOnline) {
        // Delete from server
        await apiService.delete(`/scan/${scanId}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting scan:', error);
      return { success: false, error: 'Failed to delete scan' };
    }
  };

  const searchScans = async (searchQuery) => {
    try {
      setLoading(true);
      
      if (isAuthenticated && isOnline) {
        const response = await apiService.get('/scan/search', {
          params: { q: searchQuery },
        });
        return response.data.data || [];
      } else {
        // Local search
        const filtered = scans.filter(scan => {
          const searchLower = searchQuery.toLowerCase();
          return (
            scan.itemName?.toLowerCase().includes(searchLower) ||
            scan.description?.toLowerCase().includes(searchLower) ||
            scan.category?.toLowerCase().includes(searchLower)
          );
        });
        return filtered;
      }
    } catch (error) {
      console.error('Error searching scans:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getFilteredScans = () => {
    return scans.filter(scan => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          scan.itemName?.toLowerCase().includes(searchLower) ||
          scan.description?.toLowerCase().includes(searchLower) ||
          scan.category?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Platform filter
      if (filters.platform) {
        const hasPlatform = scan.platformPrices?.[filters.platform];
        if (!hasPlatform) return false;
      }

      // Price range filter
      if (filters.minPrice !== null || filters.maxPrice !== null) {
        const prices = Object.values(scan.platformPrices || {}).flat();
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (filters.minPrice !== null && maxPrice < filters.minPrice) return false;
        if (filters.maxPrice !== null && minPrice > filters.maxPrice) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const scanDate = new Date(scan.scannedAt);
        const { start, end } = filters.dateRange;
        if (start && scanDate < new Date(start)) return false;
        if (end && scanDate > new Date(end)) return false;
      }

      return true;
    });
  };

  const syncPendingScans = async () => {
    if (!isAuthenticated || !isOnline) return;

    const unsynced = scans.filter(scan => !scan.synced);
    if (unsynced.length === 0) return;

    try {
      for (const scan of unsynced) {
        try {
          const response = await apiService.post('/scan', scan);
          // Mark as synced
          await updateScan(scan.id, { synced: true });
        } catch (error) {
          console.error('Error syncing scan:', scan.id, error);
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setScans([]);
      await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing history:', error);
      return { success: false, error: 'Failed to clear history' };
    }
  };

  const value = {
    scans,
    loading,
    error,
    filters,
    setFilters,
    loadScans,
    addScan,
    updateScan,
    deleteScan,
    searchScans,
    getFilteredScans,
    syncPendingScans,
    clearHistory,
    totalScans: scans.length,
    unsyncedCount: scans.filter(s => !s.synced).length,
  };

  return (
    <ScanHistoryContext.Provider value={value}>
      {children}
    </ScanHistoryContext.Provider>
  );
};