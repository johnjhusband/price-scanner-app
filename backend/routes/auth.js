const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database');
const { authLimiter, createAccountLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

// JWT Secret - should be in environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 10;

// Validation middleware
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper function to generate JWT
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', createAccountLimiter, signupValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      logger.security('Signup attempt with existing email', { email, ip: req.ip });
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(email, passwordHash);

    // Generate token
    const token = generateToken(result.lastInsertRowid, email);

    // Set HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info('New user registered', { userId: result.lastInsertRowid, email });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token, // Still send in body for backward compatibility
      user: {
        id: result.lastInsertRowid,
        email
      }
    });

  } catch (error) {
    logger.error('Signup error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const db = getDatabase();

    // Find user
    const user = db.prepare(`
      SELECT id, email, password_hash, is_active 
      FROM users 
      WHERE email = ?
    `).get(email);

    if (!user) {
      logger.security('Failed login attempt - unknown email', { email, ip: req.ip });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Account is disabled' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logger.security('Failed login attempt - wrong password', { email, userId: user.id, ip: req.ip });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login and usage count
    db.prepare(`
      UPDATE users 
      SET last_login = datetime('now'), 
          usage_count = usage_count + 1 
      WHERE id = ?
    `).run(user.id);

    // Generate token
    const token = generateToken(user.id, user.email);

    // Set HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      token, // Still send in body for backward compatibility
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token verification failed' 
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;