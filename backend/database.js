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