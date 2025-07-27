// Authentication service for managing user sessions

const AUTH_TOKEN_KEY = 'flippi_auth_token';
const USER_DATA_KEY = 'flippi_user_data';

class AuthService {
  // Store token and user data
  static setAuth(token, userData) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }

  // Get stored token
  static getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  // Get user data
  static getUser() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if authenticated
  static isAuthenticated() {
    return !!this.getToken();
  }

  // Clear auth data (exit)
  static exit() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
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