import { Platform } from 'react-native';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // For production, update this to your deployed backend URL
  const PRODUCTION_URL = 'https://your-production-url.com';
  
  if (__DEV__) {
    // Check if running in Docker container (web build)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // When running in Docker, use the backend container name
      // If accessed via browser, use the browser's location
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // User is accessing from host machine, backend is on same host
        return 'http://localhost:3000';
      } else {
        // User is accessing from network, use same hostname
        return `http://${hostname}:3000`;
      }
    }
    
    // In development, use the machine's IP address
    const { manifest } = Constants;
    const debuggerHost = manifest?.debuggerHost?.split(':').shift();
    
    if (debuggerHost) {
      // When connected via Expo Go
      return `http://${debuggerHost}:3000`;
    } else {
      // Fallback for emulator/simulator
      return Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000'  // Android emulator
        : 'http://localhost:3000'; // iOS simulator
    }
  }
  
  return PRODUCTION_URL;
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
  }

  async getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = await SecureStore.getItemAsync('access_token');
    }
    return this.accessToken;
  }

  async setAccessToken(token) {
    this.accessToken = token;
  }

  async request(endpoint, options = {}, retries = MAX_RETRIES) {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        ...options.headers,
      };

      // Add auth header if token exists
      if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Set content type if not multipart
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });
      
      // Handle token refresh
      if (response.status === 401 && !options.skipAuth) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          return this.request(endpoint, options, retries);
        }
      }

      // Retry on server errors
      if (response.status >= 500 && retries > 0) {
        await sleep(RETRY_DELAY);
        return this.request(endpoint, options, retries - 1);
      }

      // Parse response
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.error || `Request failed with status ${response.status}`);
        error.response = { status: response.status, data };
        throw error;
      }

      return { data, response };
    } catch (error) {
      // Retry on network errors
      if (retries > 0 && error.message.includes('Network request failed')) {
        await sleep(RETRY_DELAY);
        return this.request(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) return false;

      const { data } = await this.request('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });

      await SecureStore.setItemAsync('access_token', data.accessToken);
      await SecureStore.setItemAsync('refresh_token', data.refreshToken);
      this.accessToken = data.accessToken;

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Legacy functions for backward compatibility
export const analyzeImage = async (imageUri, base64Data) => {
  try {
    // Check network connectivity
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      throw new Error('No internet connection. Please check your network settings.');
    }

    // First try multipart form data (for compatibility)
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'item.jpg',
    });

    let response;
    try {
      response = await apiService.post('/api/scan', formData);
    } catch (error) {
      // If multipart fails and we have base64, try base64 endpoint
      if (base64Data && error.response?.status) {
        console.log('Multipart upload failed, trying base64...');
        response = await apiService.post('/api/analyze-base64', {
          image: base64Data,
          mimeType: 'image/jpeg',
        });
      } else {
        throw error;
      }
    }

    return response.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    } else if (error.message.includes('No internet connection')) {
      throw error;
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
};

export const checkServerHealth = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      throw new Error('No internet connection');
    }

    const { data } = await apiService.get('/health', { skipAuth: true });
    return data;
  } catch (error) {
    console.error('Error checking server health:', error);
    throw error;
  }
};

export const checkScanServiceHealth = async () => {
  try {
    const { data } = await apiService.get('/api/scan/health');
    return data;
  } catch (error) {
    console.error('Error checking scan service health:', error);
    throw error;
  }
};

// Cache management
const imageCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedAnalysis = (imageUri) => {
  const cached = imageCache.get(imageUri);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  imageCache.delete(imageUri);
  return null;
};

export const setCachedAnalysis = (imageUri, data) => {
  imageCache.set(imageUri, {
    data,
    timestamp: Date.now(),
  });
  
  // Cleanup old cache entries
  if (imageCache.size > 10) {
    const oldestKey = imageCache.keys().next().value;
    imageCache.delete(oldestKey);
  }
};

// Export the current API URL for debugging
export const getCurrentApiUrl = () => API_BASE_URL;

// Export the singleton instance
export default apiService;