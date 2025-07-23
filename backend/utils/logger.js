const fs = require('fs');
const path = require('path');

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    // Create logs directory if it doesn't exist
    this.logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Log file paths
    this.errorLogPath = path.join(this.logDir, 'error.log');
    this.combinedLogPath = path.join(this.logDir, 'combined.log');
    this.securityLogPath = path.join(this.logDir, 'security.log');
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(logEntry) + '\n';
  }

  writeToFile(filePath, message) {
    fs.appendFile(filePath, message, (err) => {
      if (err) console.error('Failed to write to log file:', err);
    });
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Always write to combined log
    this.writeToFile(this.combinedLogPath, formattedMessage);
    
    // Write errors to error log
    if (level === LOG_LEVELS.ERROR) {
      this.writeToFile(this.errorLogPath, formattedMessage);
    }
    
    // Write security-related logs
    if (meta.security || message.toLowerCase().includes('security') || 
        message.toLowerCase().includes('auth')) {
      this.writeToFile(this.securityLogPath, formattedMessage);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level}] ${message}`, meta);
    }
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  // Log security events
  security(event, details = {}) {
    this.log(LOG_LEVELS.WARN, `Security Event: ${event}`, {
      security: true,
      ...details
    });
  }

  // Log API requests
  logRequest(req, res, duration) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || null
    };
    
    this.info('API Request', logData);
  }
}

// Export singleton instance
module.exports = new Logger();