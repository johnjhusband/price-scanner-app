const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            error: 'Token expired'
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            error: 'Invalid token'
          });
        }
        
        console.error('Token verification error:', err);
        return res.status(401).json({
          success: false,
          error: 'Token verification failed'
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };

      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Optional authentication - doesn't fail if no token, but adds user info if valid token
const optionalAuthentication = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, but that's OK for optional auth
      return next();
    }

    const token = authHeader.substring(7);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) {
        // Valid token, attach user info
        req.user = {
          id: decoded.userId,
          email: decoded.email
        };
      }
      // Continue regardless of token validity
      next();
    });
  } catch (error) {
    // Don't fail on errors, just continue without user info
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthentication
};