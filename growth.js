const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./backend/database');
const logger = require('./backend/utils/logger');

// Load environment variables
// Try to load from .env file first, then fall back to process.env
const envPath = path.join(__dirname, '../shared/.env');
require('dotenv').config({ path: envPath });

// Ensure OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  logger.warn('[Growth Service] OPENAI_API_KEY not found in environment variables');
}

// Initialize database for growth features
try {
  initializeDatabase();
  logger.info('[Growth Service] Database initialized');
} catch (error) {
  logger.error('[Growth Service] Database initialization failed:', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.GROWTH_PORT || 3003;

// Enable trust proxy for HTTPS detection behind nginx
app.set('trust proxy', true);

// Serve static files for Growth Dashboard UI
app.use('/growth/assets', express.static(path.join(__dirname, 'growth-ui/assets')));

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`[Growth Service] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'growth',
    timestamp: new Date().toISOString()
  });
});

// Serve Growth Dashboard UI
app.get('/growth', (req, res) => {
  res.sendFile(path.join(__dirname, 'growth-ui/index.html'));
});

// Redirect /growth/ to /growth
app.get('/growth/', (req, res) => {
  res.redirect('/growth');
});

// Growth automation routes
const growthRoutes = require('./growth-backend/routes/growth');

// Mount routes
app.use('/api/growth', growthRoutes);

// Initialize growth automation modules
const redditMonitor = require('./growth-backend/growth/redditMonitor');
const { startAutomation } = require('./growth-backend/growth/redditAutomation');

// Start Reddit automation if enabled
if (process.env.ENABLE_REDDIT_AUTOMATION === 'true') {
  const intervalMinutes = parseInt(process.env.REDDIT_AUTOMATION_INTERVAL) || 30;
  logger.info(`[Growth Service] Starting Reddit automation with ${intervalMinutes} minute interval`);
  startAutomation(intervalMinutes);
}

// Error handling
app.use((error, req, res, next) => {
  logger.error('[Growth Service] Error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Not found' 
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`[Growth Service] Server running on port ${PORT}`);
  logger.info(`[Growth Service] Reddit automation: ${process.env.ENABLE_REDDIT_AUTOMATION === 'true' ? 'ENABLED' : 'DISABLED'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[Growth Service] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('[Growth Service] SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;