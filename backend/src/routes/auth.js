const express = require('express');
const router = express.Router();
const authService = require('../services/auth/authService');
const tokenService = require('../services/auth/tokenService');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

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
  try {
    const { email, username, password, fullName } = req.body;

    // Additional password validation
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Weak password',
        details: passwordValidation.errors,
      });
    }

    // Check for compromised password
    const isCompromised = await authService.checkCompromisedPassword(password);
    if (isCompromised) {
      return res.status(400).json({
        error: 'This password has been found in data breaches. Please choose a different password.',
      });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // In production: Create user in database
    // const user = await db.users.create({
    //   email: email.toLowerCase(),
    //   username: username.toLowerCase(),
    //   passwordHash,
    //   fullName,
    // });

    // For now, simulate user creation
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      fullName,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
    };

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user.id, {
      email: user.email,
      username: user.username,
    });

    // Store refresh token
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

    console.log('✅ User registered successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Login user
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    const identifier = emailOrUsername.toLowerCase();

    // Check login attempts
    authService.checkLoginAttempts(identifier);

    // In production: Find user in database
    // const user = await db.users.findByEmailOrUsername(identifier);
    
    // For now, simulate user lookup
    const user = null; // This would be the actual user from DB

    if (!user) {
      authService.recordFailedLogin(identifier);
      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: authService.checkLoginAttempts(identifier).remainingAttempts - 1,
      });
    }

    // Verify password
    // const isValidPassword = await authService.verifyPassword(password, user.passwordHash);
    const isValidPassword = false; // This would be the actual check

    if (!isValidPassword) {
      authService.recordFailedLogin(identifier);
      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: authService.checkLoginAttempts(identifier).remainingAttempts - 1,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
      });
    }

    // Clear failed login attempts
    authService.clearFailedLogins(identifier);

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user.id, {
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // Store refresh token
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

    console.log('✅ User logged in successfully:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
      },
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

  } catch (error) {
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
    // In production: Fetch fresh user data from database
    // const user = await db.users.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
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