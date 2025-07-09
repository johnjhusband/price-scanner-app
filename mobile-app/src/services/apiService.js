import { Platform } from 'react-native';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Telemetry logger
const telemetry = {
  logs: [],
  maxLogs: 1000,
  
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      platform: Platform.OS,
      version: Platform.Version,
    };
    
    // Add to in-memory log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Console output with color coding
    const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`, data);
    
    // Store critical errors for later analysis
    if (level === 'error') {
      this.storeError(entry);
    }
  },
  
  async storeError(entry) {
    try {
      const errors = await SecureStore.getItemAsync('telemetry_errors');
      const errorList = errors ? JSON.parse(errors) : [];
      errorList.push(entry);
      // Keep last 100 errors
      if (errorList.length > 100) {
        errorList.shift();
      }
      await SecureStore.setItemAsync('telemetry_errors', JSON.stringify(errorList));
    } catch (e) {
      console.error('Failed to store telemetry error:', e);
    }
  },
  
  info(message, data) {
    this.log('info', message, data);
  },
  
  warn(message, data) {
    this.log('warn', message, data);
  },
  
  error(message, data) {
    this.log('error', message, data);
  },
  
  debug(message, data) {
    this.log('debug', message, data);
  },
  
  getLogs() {
    return this.logs;
  },
  
  clearLogs() {
    this.logs = [];
  }
};

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  telemetry.info('=== API URL DETECTION START ===', {
    platform: Platform.OS,
    isDev: __DEV__,
    isWeb: Platform.OS === 'web',
    hasWindow: typeof window !== 'undefined'
  });
  
  // Check if running in web browser (both dev and production)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    telemetry.info('Web platform detected', {
      hostname,
      href: window.location.href,
      protocol: window.location.protocol,
      port: window.location.port
    });
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // User is accessing from host machine, backend is on same host
      const url = 'http://localhost:3000';
      telemetry.info('Using localhost URL', { url });
      return url;
    } else {
      // User is accessing from network, use same hostname
      const url = `http://${hostname}:3000`;
      telemetry.info('Using network hostname URL', { url, hostname });
      return url;
    }
  }
  
  // For production mobile apps, update this to your deployed backend URL
  const PRODUCTION_URL = 'https://your-production-url.com';
  
  if (__DEV__) {
    // In development, use the machine's IP address
    const { manifest } = Constants;
    const debuggerHost = manifest?.debuggerHost?.split(':').shift();
    
    telemetry.info('Development mode detected', {
      manifest: !!manifest,
      debuggerHost,
      expoConstants: Constants.expoConfig
    });
    
    if (debuggerHost) {
      // When connected via Expo Go
      const url = `http://${debuggerHost}:3000`;
      telemetry.info('Using Expo debugger host', { url, debuggerHost });
      return url;
    } else {
      // Fallback for emulator/simulator
      const url = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000'  // Android emulator
        : 'http://localhost:3000'; // iOS simulator
      telemetry.info('Using emulator/simulator fallback', { 
        url, 
        platform: Platform.OS 
      });
      return url;
    }
  }
  
  telemetry.info('Using production URL', { url: PRODUCTION_URL });
  return PRODUCTION_URL;
};

const API_BASE_URL = getApiBaseUrl();
telemetry.info('=== API CONFIGURATION COMPLETE ===', { 
  API_BASE_URL,
  timestamp: new Date().toISOString()
});
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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    telemetry.info('=== API REQUEST START ===', {
      requestId,
      endpoint,
      method: options.method || 'GET',
      hasBody: !!options.body,
      bodyType: options.body instanceof FormData ? 'FormData' : 'JSON',
      skipAuth: options.skipAuth,
      retries,
      baseURL: this.baseURL
    });
    
    try {
      const token = await this.getAccessToken();
      telemetry.debug('Access token retrieved', {
        requestId,
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      });
      
      const headers = {
        ...options.headers,
      };

      // Add auth header if token exists
      if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
        telemetry.debug('Authorization header added', { requestId });
      }

      // Set content type if not multipart
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const url = `${this.baseURL}${endpoint}`;
      telemetry.info('Sending request', {
        requestId,
        url,
        method: options.method || 'GET',
        headers: Object.keys(headers)
      });

      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      const responseTime = Date.now() - startTime;
      telemetry.info('Response received', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: response.headers ? Object.fromEntries(response.headers.entries()) : {}
      });
      
      // Handle token refresh
      if (response.status === 401 && !options.skipAuth) {
        telemetry.warn('401 Unauthorized - attempting token refresh', { requestId });
        const refreshed = await this.refreshToken();
        if (refreshed) {
          telemetry.info('Token refreshed, retrying request', { requestId });
          // Retry with new token
          return this.request(endpoint, options, retries);
        } else {
          telemetry.error('Token refresh failed', { requestId });
        }
      }

      // Retry on server errors
      if (response.status >= 500 && retries > 0) {
        telemetry.warn(`Server error ${response.status}, retrying`, {
          requestId,
          retriesLeft: retries - 1,
          delayMs: RETRY_DELAY
        });
        await sleep(RETRY_DELAY);
        return this.request(endpoint, options, retries - 1);
      }

      // Parse response
      const data = await response.json().catch((err) => {
        telemetry.warn('Failed to parse JSON response', {
          requestId,
          error: err.message
        });
        return null;
      });

      if (!response.ok) {
        const error = new Error(data?.error || `Request failed with status ${response.status}`);
        error.response = { status: response.status, data };
        
        telemetry.error('Request failed', {
          requestId,
          status: response.status,
          error: error.message,
          responseData: data,
          duration: `${Date.now() - startTime}ms`
        });
        
        throw error;
      }

      telemetry.info('=== API REQUEST SUCCESS ===', {
        requestId,
        endpoint,
        status: response.status,
        duration: `${Date.now() - startTime}ms`,
        dataReceived: !!data
      });

      return { data, response };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Retry on network errors
      if (retries > 0 && error.message.includes('Network request failed')) {
        telemetry.warn('Network error, retrying', {
          requestId,
          error: error.message,
          retriesLeft: retries - 1,
          delayMs: RETRY_DELAY,
          duration: `${duration}ms`
        });
        await sleep(RETRY_DELAY);
        return this.request(endpoint, options, retries - 1);
      }
      
      telemetry.error('=== API REQUEST FAILED ===', {
        requestId,
        endpoint,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });
      
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
  telemetry.info('=== SERVER HEALTH CHECK START ===');
  
  try {
    const networkState = await Network.getNetworkStateAsync();
    telemetry.info('Network state', {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type
    });
    
    if (!networkState.isConnected) {
      telemetry.error('No internet connection detected');
      throw new Error('No internet connection');
    }

    const startTime = Date.now();
    const { data } = await apiService.get('/health', { skipAuth: true });
    
    telemetry.info('Server health check completed', {
      duration: `${Date.now() - startTime}ms`,
      status: data?.status,
      database: data?.services?.database,
      cache: data?.services?.cache,
      uptime: data?.uptime
    });
    
    return data;
  } catch (error) {
    telemetry.error('Server health check failed', {
      error: error.message,
      stack: error.stack,
      apiUrl: API_BASE_URL
    });
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

// Export telemetry for debugging
export const getTelemetryLogs = () => telemetry.getLogs();
export const clearTelemetryLogs = () => telemetry.clearLogs();
export const getStoredErrors = async () => {
  try {
    const errors = await SecureStore.getItemAsync('telemetry_errors');
    return errors ? JSON.parse(errors) : [];
  } catch (e) {
    console.error('Failed to get stored errors:', e);
    return [];
  }
};

// Export the singleton instance
export default apiService;