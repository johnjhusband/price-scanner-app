// Database schemas for PostgreSQL/MongoDB
// These schemas can be implemented with your choice of ORM (Sequelize, Prisma, Mongoose, etc.)

const UserSchema = {
  tableName: 'users',
  fields: {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: 'uuid_generate_v4()',
    },
    email: {
      type: 'VARCHAR(255)',
      unique: true,
      notNull: true,
      index: true,
    },
    username: {
      type: 'VARCHAR(100)',
      unique: true,
      notNull: true,
      index: true,
    },
    password_hash: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    full_name: {
      type: 'VARCHAR(255)',
    },
    profile_picture_url: {
      type: 'TEXT',
    },
    is_active: {
      type: 'BOOLEAN',
      defaultValue: true,
    },
    email_verified: {
      type: 'BOOLEAN',
      defaultValue: false,
    },
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  indexes: [
    'CREATE INDEX idx_users_email ON users(email)',
    'CREATE INDEX idx_users_username ON users(username)',
  ],
};

const ScanHistorySchema = {
  tableName: 'scan_history',
  fields: {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: 'uuid_generate_v4()',
    },
    user_id: {
      type: 'UUID',
      foreignKey: 'users(id)',
      notNull: true,
      index: true,
    },
    image_url: {
      type: 'TEXT',
      notNull: true,
    },
    thumbnail_url: {
      type: 'TEXT',
    },
    item_name: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    item_category: {
      type: 'VARCHAR(100)',
    },
    item_brand: {
      type: 'VARCHAR(100)',
    },
    item_description: {
      type: 'TEXT',
    },
    condition_assessment: {
      type: 'TEXT',
    },
    price_range: {
      type: 'VARCHAR(50)',
    },
    platform_prices: {
      type: 'JSONB', // For PostgreSQL, use TEXT for MySQL
      // Stores: { ebay: "$15-25", facebook: "$10-20", ... }
    },
    confidence_score: {
      type: 'INTEGER',
      check: 'confidence_score >= 0 AND confidence_score <= 100',
    },
    ai_response: {
      type: 'JSONB', // Store complete AI response for reference
    },
    is_favorite: {
      type: 'BOOLEAN',
      defaultValue: false,
    },
    notes: {
      type: 'TEXT',
    },
    scanned_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
      index: true,
    },
    updated_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  indexes: [
    'CREATE INDEX idx_scan_history_user_id ON scan_history(user_id)',
    'CREATE INDEX idx_scan_history_scanned_at ON scan_history(scanned_at DESC)',
    'CREATE INDEX idx_scan_history_item_category ON scan_history(item_category)',
    'CREATE INDEX idx_scan_history_is_favorite ON scan_history(is_favorite)',
  ],
};

const UserSessionSchema = {
  tableName: 'user_sessions',
  fields: {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: 'uuid_generate_v4()',
    },
    user_id: {
      type: 'UUID',
      foreignKey: 'users(id)',
      notNull: true,
      index: true,
    },
    session_token: {
      type: 'VARCHAR(255)',
      unique: true,
      notNull: true,
      index: true,
    },
    device_info: {
      type: 'JSONB',
      // Stores: { platform: 'ios', version: '14.0', device: 'iPhone 12' }
    },
    ip_address: {
      type: 'INET',
    },
    expires_at: {
      type: 'TIMESTAMP',
      notNull: true,
      index: true,
    },
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
  indexes: [
    'CREATE INDEX idx_user_sessions_token ON user_sessions(session_token)',
    'CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at)',
  ],
};

const PriceAlertSchema = {
  tableName: 'price_alerts',
  fields: {
    id: {
      type: 'UUID',
      primaryKey: true,
      defaultValue: 'uuid_generate_v4()',
    },
    user_id: {
      type: 'UUID',
      foreignKey: 'users(id)',
      notNull: true,
      index: true,
    },
    scan_id: {
      type: 'UUID',
      foreignKey: 'scan_history(id)',
      notNull: true,
    },
    target_price: {
      type: 'DECIMAL(10, 2)',
      notNull: true,
    },
    platform: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    is_active: {
      type: 'BOOLEAN',
      defaultValue: true,
    },
    last_checked_at: {
      type: 'TIMESTAMP',
    },
    triggered_at: {
      type: 'TIMESTAMP',
    },
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  },
};

// SQL Migration Scripts
const createTableQueries = {
  postgresql: {
    enableUUID: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    
    createUsers: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        profile_picture_url TEXT,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    
    createScanHistory: `
      CREATE TABLE IF NOT EXISTS scan_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        item_name VARCHAR(255) NOT NULL,
        item_category VARCHAR(100),
        item_brand VARCHAR(100),
        item_description TEXT,
        condition_assessment TEXT,
        price_range VARCHAR(50),
        platform_prices JSONB,
        confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
        ai_response JSONB,
        is_favorite BOOLEAN DEFAULT false,
        notes TEXT,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    
    createUserSessions: `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        device_info JSONB,
        ip_address INET,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    
    createPriceAlerts: `
      CREATE TABLE IF NOT EXISTS price_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scan_id UUID NOT NULL REFERENCES scan_history(id) ON DELETE CASCADE,
        target_price DECIMAL(10, 2) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_checked_at TIMESTAMP,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
};

// MongoDB Schemas (for Mongoose)
const mongooseSchemas = {
  User: {
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: String,
    profilePictureUrl: String,
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  
  ScanHistory: {
    userId: { type: 'ObjectId', ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    thumbnailUrl: String,
    itemName: { type: String, required: true },
    itemCategory: String,
    itemBrand: String,
    itemDescription: String,
    conditionAssessment: String,
    priceRange: String,
    platformPrices: {
      ebay: String,
      facebook: String,
      poshmark: String,
      mercari: String,
      whatnot: String,
    },
    confidenceScore: { type: Number, min: 0, max: 100 },
    aiResponse: Object,
    isFavorite: { type: Boolean, default: false },
    notes: String,
    scannedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  
  UserSession: {
    userId: { type: 'ObjectId', ref: 'User', required: true },
    sessionToken: { type: String, required: true, unique: true },
    deviceInfo: {
      platform: String,
      version: String,
      device: String,
    },
    ipAddress: String,
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  
  PriceAlert: {
    userId: { type: 'ObjectId', ref: 'User', required: true },
    scanId: { type: 'ObjectId', ref: 'ScanHistory', required: true },
    targetPrice: { type: Number, required: true },
    platform: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastCheckedAt: Date,
    triggeredAt: Date,
    createdAt: { type: Date, default: Date.now },
  },
};

module.exports = {
  schemas: {
    UserSchema,
    ScanHistorySchema,
    UserSessionSchema,
    PriceAlertSchema,
  },
  createTableQueries,
  mongooseSchemas,
};