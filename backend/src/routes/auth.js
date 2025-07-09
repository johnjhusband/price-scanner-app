const express = require('express');
const router = express.Router();
const authService = require('../services/auth/authService');
const tokenService = require('../services/auth/tokenService');
const { users, dbLogger } = require('../config/database');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Create routes logger
const routeLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'auth-routes-telemetry.log' })
  ]
});

// Rate limiters for different endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many accounts created from this IP, please try again later',
});

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
];

const validateLogin = [
  body('emailOrUsername')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// POST /api/auth/register - Register new user
router.post('/register', registerLimiter, validateRegistration, handleValidationErrors, async (req, res, next) => {
  const startTime = Date.now();
  const { email, username, password, fullName } = req.body;
  
  routeLogger.info('=== REGISTRATION ATTEMPT ===', {
    email,
    username,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  try {
    // Additional password validation
    routeLogger.debug('Validating password strength');
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      routeLogger.warn('Registration failed: weak password', {
        email,
        passwordScore: passwordValidation.score,
        errors: passwordValidation.errors
      });
      return res.status(400).json({
        error: 'Weak password',
        details: passwordValidation.errors,
      });
    }

    // Check for compromised password
    routeLogger.debug('Checking for compromised password');
    const isCompromised = await authService.checkCompromisedPassword(password);
    if (isCompromised) {
      routeLogger.warn('Registration failed: compromised password', { email });
      return res.status(400).json({
        error: 'This password has been found in data breaches. Please choose a different password.',
      });
    }

    // Hash password
    routeLogger.debug('Hashing password');
    const passwordHash = await authService.hashPassword(password);
    routeLogger.debug('Password hashed successfully');

    // Create user in database
    routeLogger.info('Creating user in database', { email, username });
    const user = await users.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName,
    });
    routeLogger.info('User created successfully', { userId: user.id });

    // Generate tokens
    routeLogger.debug('Generating authentication tokens');
    const { accessToken, refreshToken } = authService.generateTokens(user.id, {
      email: user.email,
      username: user.username,
    });

    // Store refresh token
    routeLogger.debug('Storing refresh token');
    const fingerprint = authService.createSessionFingerprint(req);
    await tokenService.storeRefreshToken(user.id, refreshToken, {
      fingerprint,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const duration = Date.now() - startTime;
    routeLogger.info('✅ Registration completed successfully', {
      userId: user.id,
      email: user.email,
      duration: `${duration}ms`
    });
    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    routeLogger.error('❌ Registration failed with error', {
      email,
      error: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      duration: `${duration}ms`
    });
    next(error);
  }
});

// POST /api/auth/login - Login user
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res, next) => {
  const startTime = Date.now();
  const { emailOrUsername, password } = req.body;
  const identifier = emailOrUsername.toLowerCase();
  
  routeLogger.info('=== LOGIN ATTEMPT ===', {
    identifier,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  try {
    // Check login attempts
    routeLogger.debug('Checking login attempt limits', { identifier });
    authService.checkLoginAttempts(identifier);

    // Find user in database
    routeLogger.info('Looking up user in database', { identifier });
    const user = await users.findByEmailOrUsername(identifier);

    if (!user) {
      routeLogger.warn('Login failed: user not found', { identifier });
      authService.recordFailedLogin(identifier);
      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: authService.checkLoginAttempts(identifier).remainingAttempts - 1,
      });
    }
    
    routeLogger.debug('User found', { userId: user.id, email: user.email });

    // Verify password
    routeLogger.debug('Verifying password');
    const isValidPassword = await authService.verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      routeLogger.warn('Login failed: invalid password', { 
        identifier,
        userId: user.id 
      });
      authService.recordFailedLogin(identifier);
      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: authService.checkLoginAttempts(identifier).remainingAttempts - 1,
      });
    }

    // Check if user is active
    if (!user.is_active) {
      routeLogger.warn('Login failed: account deactivated', {
        identifier,
        userId: user.id
      });
      return res.status(401).json({
        error: 'Account is deactivated',
      });
    }

    // Clear failed login attempts
    routeLogger.debug('Clearing failed login attempts');
    authService.clearFailedLogins(identifier);

    // Generate tokens
    routeLogger.debug('Generating authentication tokens');
    const { accessToken, refreshToken } = authService.generateTokens(user.id, {
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Store refresh token
    routeLogger.debug('Storing refresh token');
    const fingerprint = authService.createSessionFingerprint(req);
    await tokenService.storeRefreshToken(user.id, refreshToken, {
      fingerprint,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // Set secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const duration = Date.now() - startTime;
    routeLogger.info('✅ Login completed successfully', {
      userId: user.id,
      email: user.email,
      duration: `${duration}ms`
    });
    console.log('✅ User logged in successfully:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    routeLogger.error('❌ Login failed with error', {
      identifier,
      error: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
      duration: `${duration}ms`
    });
    next(error);
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
      });
    }

    // Check if token is blacklisted
    if (tokenService.isBlacklisted(refreshToken)) {
      return res.status(401).json({
        error: 'Invalid refresh token',
      });
    }

    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refreshToken);

    // Rotate refresh token
    const fingerprint = authService.createSessionFingerprint(req);
    const tokenData = await tokenService.rotateRefreshToken(refreshToken, fingerprint);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(
      tokenData.userId,
      { ...decoded, type: undefined }
    );

    // Store new refresh token
    await tokenService.storeRefreshToken(tokenData.userId, newRefreshToken, {
      fingerprint,
      family: tokenData.family,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // Set new cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

  } catch (error) {
    if (error.message.includes('Token reuse detected')) {
      // Security breach - clear cookie
      res.clearCookie('refreshToken');
    }
    next(error);
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authService.authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    // Revoke tokens
    if (refreshToken) {
      await tokenService.revokeToken(refreshToken);
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    console.log('✅ User logged out successfully:', req.user.email);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authService.authenticate, async (req, res, next) => {
  try {
    // Revoke all user tokens
    const revokedCount = await tokenService.revokeUserTokens(req.user.id);

    // Clear cookie
    res.clearCookie('refreshToken');

    console.log(`✅ User logged out from ${revokedCount} devices:`, req.user.email);

    res.json({
      success: true,
      message: `Logged out from ${revokedCount} devices`,
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authService.authenticate, async (req, res, next) => {
  try {
    // Fetch fresh user data from database
    const user = await users.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
      },
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/auth/sessions - Get active sessions
router.get('/sessions', authService.authenticate, async (req, res, next) => {
  try {
    const sessions = await tokenService.getUserSessions(req.user.id);

    res.json({
      success: true,
      sessions,
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/auth/health - Auth service health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Authentication Service',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;