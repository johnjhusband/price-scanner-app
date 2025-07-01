const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

// In production, these would interact with your database
// For now, using in-memory storage for demonstration
const users = new Map();
const sessions = new Map();

class AuthService {
  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(userId) {
    return jwt.sign(
      { userId, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Register new user
  static async register(email, username, password, fullName = '') {
    // Validate input
    if (!email || !username || !password) {
      throw new Error('Email, username, and password are required');
    }

    // Check if user already exists
    if (users.has(email) || Array.from(users.values()).some(u => u.username === username)) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user object
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      passwordHash,
      fullName,
      isActive: true,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store user (in production, save to database)
    users.set(email.toLowerCase(), user);

    // Generate token
    const token = this.generateToken(user.id);

    // Create session
    const session = {
      userId: user.id,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    sessions.set(token, session);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  // Login user
  static async login(emailOrUsername, password) {
    if (!emailOrUsername || !password) {
      throw new Error('Email/username and password are required');
    }

    // Find user by email or username
    let user = users.get(emailOrUsername.toLowerCase());
    if (!user) {
      user = Array.from(users.values()).find(
        u => u.username === emailOrUsername.toLowerCase()
      );
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate new token
    const token = this.generateToken(user.id);

    // Create session
    const session = {
      userId: user.id,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    sessions.set(token, session);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  // Logout user
  static logout(token) {
    sessions.delete(token);
    return { message: 'Logged out successfully' };
  }

  // Get user from token
  static getUserFromToken(token) {
    const session = sessions.get(token);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      sessions.delete(token);
      return null;
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.id === session.userId);
    if (!user) {
      return null;
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Middleware to verify authentication
  static authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = AuthService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  }

  // Optional authentication middleware
  static optionalAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const user = AuthService.getUserFromToken(token);
      req.user = user;
    }
    
    next();
  }
}

module.exports = AuthService;