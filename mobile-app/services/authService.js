// Authentication service for managing user sessions

import StorageService from './storage';

const AUTH_TOKEN_KEY = 'flippi_auth_token';
const USER_DATA_KEY = 'flippi_user_data';

class AuthService {
  // Store token and user data
  static async setAuth(token, userData) {
    await StorageService.set(AUTH_TOKEN_KEY, token);
    await StorageService.set(USER_DATA_KEY, JSON.stringify(userData));
  }

  // Get stored token
  static async getToken() {
    return await StorageService.get(AUTH_TOKEN_KEY);
  }

  // Get user data
  static async getUser() {
    const userData = await StorageService.get(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if authenticated
  static async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }

  // Clear auth data (exit)
  static async exit() {
    await StorageService.remove(AUTH_TOKEN_KEY);
    await StorageService.remove(USER_DATA_KEY);
  }

  // Parse token from URL (after OAuth redirect)
  static parseTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Decode JWT to get user data
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.setAuth(token, {
          id: payload.id,
          email: payload.email,
          name: payload.name
        });
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      } catch (error) {
        console.error('Failed to parse token:', error);
        return false;
      }
    }
    
    return false;
  }
}

export default AuthService;