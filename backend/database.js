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