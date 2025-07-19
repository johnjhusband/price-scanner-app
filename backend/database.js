const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

let db;

function initializeDatabase() {
  const dbPath = process.env.FEEDBACK_DB_PATH || './feedback.db';
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Create or open database
  db = new Database(dbPath);
  
  // Create table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      helped_decision BOOLEAN NOT NULL,
      feedback_text TEXT,
      user_description TEXT,
      image_data BLOB NOT NULL,
      scan_data JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (length(feedback_text) <= 500)
    )
  `;
  
  db.exec(createTableSQL);
  
  console.log(`Database initialized at: ${dbPath}`);
  
  return db;
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