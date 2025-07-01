const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);

// Import database connection (to be implemented)
// const db = require('../../config/database');

// Error classes
class AuthError extends Error {
  constructor(message, statusCode = 401, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

class AuthService {
  constructor() {
    // Validate required environment variables
    const requiredEnvVars = [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'JWT_ACCESS_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
      'BCRYPT_ROUNDS'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    this.saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.loginAttempts = new Map(); // Track failed login attempts
  }

  // Generate secure tokens
  generateTokens(userId, additionalClaims = {}) {
    const payload = {
      userId,
      ...additionalClaims,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      process.env.JWT_ACCESS_SECRET,
      { 
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        issuer: 'thrifting-buddy',
        audience: 'thrifting-buddy-api'
      }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'thrifting-buddy',
        audience: 'thrifting-buddy-api'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify tokens with proper validation
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: 'thrifting-buddy',
        audience: 'thrifting-buddy-api'
      });

      if (decoded.type !== 'access') {
        throw new AuthError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Access token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthError('Invalid access token', 401, 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'thrifting-buddy',
        audience: 'thrifting-buddy-api'
      });

      if (decoded.type !== 'refresh') {
        throw new AuthError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  }

  // Secure password hashing
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    };
  }

  // Check for compromised passwords (basic implementation)
  async checkCompromisedPassword(password) {
    // In production, integrate with HaveIBeenPwned API
    const commonPasswords = [
      'password', '12345678', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', '123456789', 'password1'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  // Rate limiting for login attempts
  checkLoginAttempts(identifier) {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: null };
    const now = Date.now();
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Reset if lockout period has passed
    if (attempts.lastAttempt && (now - attempts.lastAttempt) > lockoutDuration) {
      this.loginAttempts.delete(identifier);
      return { allowed: true, remainingAttempts: maxAttempts };
    }

    if (attempts.count >= maxAttempts) {
      const timeLeft = lockoutDuration - (now - attempts.lastAttempt);
      throw new AuthError(
        `Account locked due to multiple failed login attempts. Try again in ${Math.ceil(timeLeft / 60000)} minutes`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    return { 
      allowed: true, 
      remainingAttempts: maxAttempts - attempts.count 
    };
  }

  recordFailedLogin(identifier) {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: null };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(identifier, attempts);
  }

  clearFailedLogins(identifier) {
    this.loginAttempts.delete(identifier);
  }

  // Generate secure random tokens
  async generateSecureToken(length = 32) {
    const buffer = await randomBytes(length);
    return buffer.toString('base64url');
  }

  // Create session fingerprint
  createSessionFingerprint(req) {
    const fingerprint = {
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      acceptLanguage: req.get('accept-language'),
      acceptEncoding: req.get('accept-encoding'),
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprint))
      .digest('hex');
  }

  // Middleware for authentication
  authenticate = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        throw new AuthError('No token provided', 401, 'NO_TOKEN');
      }

      const decoded = this.verifyAccessToken(token);
      
      // In production, fetch user from database
      // const user = await db.users.findById(decoded.userId);
      // if (!user || !user.isActive) {
      //   throw new AuthError('User not found or inactive', 401, 'USER_NOT_FOUND');
      // }

      req.user = { id: decoded.userId, ...decoded };
      req.token = token;
      
      next();
    } catch (error) {
      next(error);
    }
  };

  // Optional authentication middleware
  optionalAuth = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (token) {
        const decoded = this.verifyAccessToken(token);
        req.user = { id: decoded.userId, ...decoded };
        req.token = token;
      }
      
      next();
    } catch (error) {
      // Ignore authentication errors for optional auth
      next();
    }
  };

  // Extract token from various sources
  extractToken(req) {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies (if using)
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }

    // Check query parameter (less secure, use with caution)
    if (req.query && req.query.token) {
      return req.query.token;
    }

    return null;
  }

  // Role-based access control
  authorize(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AuthError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return next(new AuthError('Insufficient permissions', 403, 'FORBIDDEN'));
      }

      next();
    };
  }
}

// Export singleton instance
module.exports = new AuthService();