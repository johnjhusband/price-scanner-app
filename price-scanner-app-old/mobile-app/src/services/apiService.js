import axios from 'axios';

// Configure the base URL for your backend
// Change this to your deployed backend URL when ready
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-backend-url.com/api';  // Production

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for image analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message);
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        success: false,
        error: 'Request timeout - analysis is taking too long'
      });
    }
    
    if (error.response?.status === 429) {
      return Promise.reject({
        success: false,
        error: 'Too many requests. Please wait a moment and try again.'
      });
    }
    
    if (error.response?.status === 401) {
      return Promise.reject({
        success: false,
        error: 'API authentication failed. Please check server configuration.'
      });
    }
    
    if (!error.response) {
      return Promise.reject({
        success: false,
        error: 'Unable to connect to server. Please check your internet connection.'
      });
    }
    
    return Promise.reject(error);
  }
);

/**
 * Analyze an image using the backend API
 * @param {string} base64Image - Base64 encoded image data
 * @param {string} mimeType - MIME type of the image (default: image/jpeg)
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeImage = async (base64Image, mimeType = 'image/jpeg') => {
  try {
    console.log('📸 Sending image for analysis...');
    
    const response = await apiClient.post('/analyze-base64', {
      image: base64Image,
      mimeType: mimeType,
    });
    
    console.log('✅ Analysis completed successfully');
    return response.data;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    
    // Return a structured error response
    if (error.success === false) {
      return error; // Already formatted error from interceptor
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Analysis failed'
    };
  }
};

/**
 * Check if the backend server is healthy
 * @returns {Promise<Object>} Health check result
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000
    });
    
    return {
      success: true,
      status: response.data.status,
      timestamp: response.data.timestamp
    };
  } catch (error) {
    return {
      success: false,
      error: 'Server is not responding'
    };
  }
};

// Export the configured axios instance for custom requests
export { apiClient };

// Export API configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
}; 