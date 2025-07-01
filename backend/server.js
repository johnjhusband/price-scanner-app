const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import utilities and middleware
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler, initializeErrorMonitoring } = require('./src/middleware/errorHandler');
const { checkDatabaseConnection } = require('./src/config/database');
const tokenService = require('./src/services/auth/tokenService');

// Initialize error monitoring
const Sentry = initializeErrorMonitoring();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy
app.set('trust proxy', 1);

// Sentry request handler (must be first)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:8081', 'http://localhost:19006', 'exp://localhost:19000', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  req.logger = logger.addRequestId(req.id);
  next();
});

// Rate limiting
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        user: req.user?.id,
      });
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Global rate limiter
app.use(createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  'Too many requests, please try again later'
));

// Cookie parser middleware
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const scanRoutes = require('./src/routes/scan');
const analyzeRoutes = require('./src/routes/analyze');
const authRoutes = require('./src/routes/auth');

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await checkDatabaseConnection();
  
  const health = {
    status: dbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      cache: 'not implemented', // Update when Redis is added
    },
  };

  res.status(dbConnected ? 200 : 503).json(health);
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api', analyzeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'My Thrifting Buddy API', 
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        refresh: '/api/auth/refresh',
        logout: '/api/auth/logout',
        me: '/api/auth/me',
        sessions: '/api/auth/sessions'
      },
      scan: {
        analyze: 'POST /api/scan',
        history: 'GET /api/scan/history',
        search: 'GET /api/scan/search',
        details: 'GET /api/scan/:id',
        update: 'PUT /api/scan/:id',
        delete: 'DELETE /api/scan/:id'
      }
    }
  });
});

// Sentry error handler (must be before other error handlers)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  // Stop accepting new connections
  server.close(async () => {
    try {
      // Close database connections
      const { db } = require('./src/config/database');
      await db.destroy();
      
      // Close any other connections (Redis, etc.)
      
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`🚀 My Thrifting Buddy Backend running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔍 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🌐 Server binding to all interfaces (0.0.0.0:${PORT})`);
  
  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    logger.error('⚠️  Database connection failed - running in degraded mode');
  }
  
  // Start cleanup tasks
  tokenService.startCleanupTask();
  
  // Log security configuration
  logger.info('🔒 Security features enabled:', {
    helmet: true,
    cors: true,
    rateLimiting: true,
    compression: true,
    cookieParser: true,
  });
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;