const { Pool } = require('pg');
const knex = require('knex');
const winston = require('winston');

// Create logger for database operations
const dbLogger = winston.createLogger({
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
    new winston.transports.File({ filename: 'database-telemetry.log' })
  ]
});

// Log environment and configuration
dbLogger.info('=== DATABASE CONFIGURATION INITIALIZATION ===');
dbLogger.info('Environment:', { NODE_ENV: process.env.NODE_ENV });
dbLogger.info('Database URL:', { 
  url: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 'NOT SET'
});

// Database configuration
const dbConfig = {
  development: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 10,
      createTimeoutMillis: 3000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      directory: './src/migrations',
    },
    seeds: {
      directory: './src/seeds',
    },
    // Enable query logging
    debug: true,
    log: {
      warn(message) {
        dbLogger.warn('Knex Warning:', message);
      },
      error(message) {
        dbLogger.error('Knex Error:', message);
      },
      deprecate(message) {
        dbLogger.warn('Knex Deprecation:', message);
      },
      debug(message) {
        dbLogger.debug('Knex Debug:', message);
      }
    }
  },
  production: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: './src/migrations',
    },
  },
};

// Create Knex instance
const environment = process.env.NODE_ENV || 'development';
dbLogger.info('Creating Knex instance', { environment, config: dbConfig[environment] });

const db = knex(dbConfig[environment]);

// Add query event listeners for telemetry
db.on('query', (queryData) => {
  dbLogger.debug('SQL Query:', {
    sql: queryData.sql,
    bindings: queryData.bindings,
    method: queryData.method
  });
});

db.on('query-error', (error, queryData) => {
  dbLogger.error('SQL Query Error:', {
    error: error.message,
    code: error.code,
    sql: queryData.sql,
    bindings: queryData.bindings
  });
});

db.on('query-response', (response, queryData) => {
  dbLogger.debug('SQL Query Response:', {
    sql: queryData.sql,
    rowCount: Array.isArray(response) ? response.length : 'N/A',
    duration: queryData.queryContext ? queryData.queryContext.duration : 'unknown'
  });
});

// Database health check
const checkDatabaseConnection = async () => {
  dbLogger.info('Starting database connection check...');
  const startTime = Date.now();
  
  try {
    dbLogger.debug('Executing test query: SELECT 1');
    const result = await db.raw('SELECT 1 as test, version() as version, current_database() as database');
    const duration = Date.now() - startTime;
    
    dbLogger.info('✅ Database connection successful', {
      duration: `${duration}ms`,
      version: result.rows[0].version,
      database: result.rows[0].database
    });
    
    // Test if tables exist
    try {
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      dbLogger.info('Database tables found:', {
        tables: tables.rows.map(r => r.table_name),
        count: tables.rows.length
      });
    } catch (tableError) {
      dbLogger.error('Failed to list tables:', tableError.message);
    }
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLogger.error('❌ Database connection failed:', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      host: error.host,
      port: error.port,
      duration: `${duration}ms`,
      stack: error.stack
    });
    return false;
  }
};

// User model
const users = {
  // Create new user
  create: async (userData) => {
    dbLogger.info('Creating new user', { email: userData.email, username: userData.username });
    const startTime = Date.now();
    
    try {
      const [user] = await db('users')
        .insert({
          ...userData,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning(['id', 'email', 'username', 'full_name', 'is_active', 'email_verified', 'created_at']);
      
      const duration = Date.now() - startTime;
      dbLogger.info('User created successfully', { 
        userId: user.id, 
        email: user.email,
        duration: `${duration}ms`
      });
      
      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbLogger.error('Failed to create user', {
        email: userData.email,
        error: error.message,
        code: error.code,
        detail: error.detail,
        duration: `${duration}ms`
      });
      throw error;
    }
  },

  // Find user by ID
  findById: async (id) => {
    const user = await db('users')
      .where({ id })
      .first();
    
    return user;
  },

  // Find user by email
  findByEmail: async (email) => {
    const user = await db('users')
      .where({ email: email.toLowerCase() })
      .first();
    
    return user;
  },

  // Find user by username
  findByUsername: async (username) => {
    const user = await db('users')
      .where({ username: username.toLowerCase() })
      .first();
    
    return user;
  },

  // Find by email or username
  findByEmailOrUsername: async (identifier) => {
    dbLogger.info('Finding user by email or username', { identifier });
    const startTime = Date.now();
    
    try {
      const user = await db('users')
        .where('email', identifier.toLowerCase())
        .orWhere('username', identifier.toLowerCase())
        .first();
      
      const duration = Date.now() - startTime;
      dbLogger.info('User lookup completed', {
        identifier,
        found: !!user,
        userId: user?.id,
        duration: `${duration}ms`
      });
      
      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbLogger.error('Failed to find user', {
        identifier,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`
      });
      throw error;
    }
  },

  // Update user
  update: async (id, updates) => {
    const [user] = await db('users')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'username', 'full_name', 'is_active', 'email_verified', 'updated_at']);
    
    return user;
  },

  // Check if email exists
  emailExists: async (email) => {
    const result = await db('users')
      .where({ email: email.toLowerCase() })
      .count('id as count')
      .first();
    
    return result.count > 0;
  },

  // Check if username exists
  usernameExists: async (username) => {
    const result = await db('users')
      .where({ username: username.toLowerCase() })
      .count('id as count')
      .first();
    
    return result.count > 0;
  },
};

// Scan history model
const scanHistory = {
  // Create new scan record
  create: async (scanData) => {
    const [scan] = await db('scan_history')
      .insert({
        ...scanData,
        scanned_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    return scan;
  },

  // Find scan by ID
  findById: async (id) => {
    const scan = await db('scan_history')
      .where({ id })
      .first();
    
    return scan;
  },

  // Get user's scan history
  getUserScans: async (userId, { limit = 20, offset = 0, orderBy = 'scanned_at', order = 'desc' } = {}) => {
    const scans = await db('scan_history')
      .where({ user_id: userId })
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    return scans;
  },

  // Get user's scan count
  getUserScanCount: async (userId) => {
    const result = await db('scan_history')
      .where({ user_id: userId })
      .count('id as count')
      .first();
    
    return parseInt(result.count);
  },

  // Update scan
  update: async (id, userId, updates) => {
    const [scan] = await db('scan_history')
      .where({ id, user_id: userId })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');
    
    return scan;
  },

  // Delete scan
  delete: async (id, userId) => {
    const deleted = await db('scan_history')
      .where({ id, user_id: userId })
      .delete();
    
    return deleted > 0;
  },

  // Search scans
  search: async (userId, query, { limit = 20, offset = 0 } = {}) => {
    const scans = await db('scan_history')
      .where({ user_id: userId })
      .where((builder) => {
        builder
          .where('item_name', 'ilike', `%${query}%`)
          .orWhere('item_category', 'ilike', `%${query}%`)
          .orWhere('item_brand', 'ilike', `%${query}%`)
          .orWhere('item_description', 'ilike', `%${query}%`);
      })
      .orderBy('scanned_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return scans;
  },
};

// Refresh tokens model
const refreshTokens = {
  // Store refresh token
  create: async (tokenData) => {
    const [token] = await db('refresh_tokens')
      .insert({
        ...tokenData,
        created_at: new Date(),
      })
      .returning('*');
    
    return token;
  },

  // Find token
  findByToken: async (token) => {
    const tokenData = await db('refresh_tokens')
      .where({ token })
      .first();
    
    return tokenData;
  },

  // Mark token as used
  markAsUsed: async (token) => {
    const [updated] = await db('refresh_tokens')
      .where({ token })
      .update({ used: true })
      .returning('*');
    
    return updated;
  },

  // Delete token
  delete: async (token) => {
    const deleted = await db('refresh_tokens')
      .where({ token })
      .delete();
    
    return deleted > 0;
  },

  // Delete all user tokens
  deleteUserTokens: async (userId) => {
    const deleted = await db('refresh_tokens')
      .where({ user_id: userId })
      .delete();
    
    return deleted;
  },

  // Delete tokens by family
  deleteTokenFamily: async (family) => {
    const deleted = await db('refresh_tokens')
      .where({ family })
      .delete();
    
    return deleted;
  },

  // Clean expired tokens
  cleanExpired: async () => {
    const deleted = await db('refresh_tokens')
      .where('expires_at', '<', new Date())
      .delete();
    
    return deleted;
  },

  // Get user's active tokens
  getUserTokens: async (userId) => {
    const tokens = await db('refresh_tokens')
      .where({ user_id: userId, used: false })
      .where('expires_at', '>', new Date())
      .select(['created_at', 'expires_at', 'device_info', 'ip_address']);
    
    return tokens;
  },
};

// Transaction helper
const transaction = async (callback) => {
  return await db.transaction(callback);
};

module.exports = {
  db,
  dbLogger,
  checkDatabaseConnection,
  users,
  scanHistory,
  refreshTokens,
  transaction,
};