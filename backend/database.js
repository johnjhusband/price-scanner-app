const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db;

function initializeDatabase() {
  const dbPath = process.env.FEEDBACK_DB_PATH || './feedback.db';
  
  console.log('Initializing database at:', dbPath);
  console.log('Current working directory:', process.cwd());
  
  try {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    console.log('Database directory:', dbDir);
    
    if (!fs.existsSync(dbDir)) {
      console.log('Creating database directory...');
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Check directory permissions
    try {
      fs.accessSync(dbDir, fs.constants.W_OK);
      console.log('Database directory is writable');
    } catch (err) {
      console.error('Database directory is not writable:', err);
    }
    
    // Create or open database
    db = new Database(dbPath);
    console.log('Database connection established');
    
    // Create table if it doesn't exist
    const createTableSQL = `
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
    
    db.exec(createTableSQL);
    console.log('Feedback table created/verified');
    
    // Test the database with a simple query
    const testQuery = db.prepare('SELECT COUNT(*) as count FROM feedback').get();
    console.log('Database test query successful, current feedback count:', testQuery.count);
    
    console.log(`Database initialized successfully at: ${dbPath}`);
    
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