const { Pool } = require('pg');
const knex = require('knex');

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
const db = knex(dbConfig[environment]);

// Database health check
const checkDatabaseConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// User model
const users = {
  // Create new user
  create: async (userData) => {
    const [user] = await db('users')
      .insert({
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning(['id', 'email', 'username', 'full_name', 'is_active', 'email_verified', 'created_at']);
    
    return user;
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
    const user = await db('users')
      .where('email', identifier.toLowerCase())
      .orWhere('username', identifier.toLowerCase())
      .first();
    
    return user;
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
  checkDatabaseConnection,
  users,
  scanHistory,
  refreshTokens,
  transaction,
};