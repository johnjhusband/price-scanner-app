let Database;
try {
  Database = require('better-sqlite3');

} catch (loadError) {
  console.error('Failed to load better-sqlite3:', loadError.message);
  throw new Error('Database module not available. Run: npm install better-sqlite3');
}

const fs = require('fs');
const path = require('path');

let db;

function initializeDatabase() {
  // Use environment variable if set, otherwise fall back to /tmp
  const dbPath = process.env.FEEDBACK_DB_PATH || '/tmp/flippi-feedback.db';

  if (!process.env.FEEDBACK_DB_PATH) {
    console.warn('WARNING: FEEDBACK_DB_PATH not set, using temporary directory. Data may be lost on restart!');
  }

  try {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {

      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Check directory permissions
    try {
      fs.accessSync(dbDir, fs.constants.W_OK);

    } catch (err) {
      console.error('Database directory is not writable:', err);
    }
    
    // Create or open database
    db = new Database(dbPath);

    // Create table if it doesn't exist
    // Create feedback table
    const createFeedbackTableSQL = `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        analysis_id TEXT NOT NULL,
        helped_decision BOOLEAN,
        feedback_text TEXT,
        user_description TEXT,
        image_data BLOB NOT NULL,
        scan_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK (length(feedback_text) <= 500)
      )
    `;
    
    db.exec(createFeedbackTableSQL);
    
    // Add analysis_id column if it doesn't exist (for existing databases)
    try {
      db.exec(`ALTER TABLE feedback ADD COLUMN analysis_id TEXT`);
      console.log('Added analysis_id column to feedback table');
    } catch (e) {
      // Column already exists, ignore error
    }
    
    // Create feedback_analysis table for GPT categorization
    const createAnalysisTableSQL = `
      CREATE TABLE IF NOT EXISTS feedback_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        sentiment TEXT,
        category TEXT,
        suggestion_type TEXT,
        summary TEXT,
        gpt_response JSON,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES feedback(id)
      )
    `;
    
    db.exec(createAnalysisTableSQL);
    
    // Create index for faster lookups
    db.exec(`CREATE INDEX IF NOT EXISTS idx_feedback_analysis_id ON feedback(analysis_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_feedback_analysis_feedback_id ON feedback_analysis(feedback_id)`);
    
    // Create pattern_detection table
    const createPatternDetectionSQL = `
      CREATE TABLE IF NOT EXISTS pattern_detection (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL,
        pattern_key TEXT NOT NULL,
        occurrence_count INTEGER DEFAULT 1,
        first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        flagged BOOLEAN DEFAULT 0,
        flagged_at TIMESTAMP,
        resolved BOOLEAN DEFAULT 0,
        resolved_at TIMESTAMP,
        details JSON,
        UNIQUE(pattern_type, pattern_key)
      )
    `;
    
    db.exec(createPatternDetectionSQL);
    
    // Create manual_overrides table
    const createOverridesSQL = `
      CREATE TABLE IF NOT EXISTS manual_overrides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        override_type TEXT NOT NULL,
        target_key TEXT NOT NULL,
        adjustment_type TEXT NOT NULL,
        adjustment_value REAL NOT NULL,
        reason TEXT,
        active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        expires_at TIMESTAMP,
        applied_count INTEGER DEFAULT 0
      )
    `;
    
    db.exec(createOverridesSQL);
    
    // Create weekly_reports table
    const createReportsSQL = `
      CREATE TABLE IF NOT EXISTS weekly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_date DATE NOT NULL,
        total_feedback INTEGER,
        positive_count INTEGER,
        negative_count INTEGER,
        neutral_count INTEGER,
        most_common_issue TEXT,
        most_affected_brand TEXT,
        report_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_date)
      )
    `;
    
    db.exec(createReportsSQL);

    // Test the database with a simple query
    const testQuery = db.prepare('SELECT COUNT(*) as count FROM feedback').get();

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase
};