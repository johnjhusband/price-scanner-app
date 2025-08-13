// Create automation tracking tables
const createAutomationTables = (db) => {
  // Track automation runs
  db.exec(`
    CREATE TABLE IF NOT EXISTS automation_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration_seconds INTEGER,
      total_processed INTEGER DEFAULT 0,
      total_skipped INTEGER DEFAULT 0,
      total_errors INTEGER DEFAULT 0,
      stats_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Track errors for review
  db.exec(`
    CREATE TABLE IF NOT EXISTS automation_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subreddit TEXT NOT NULL,
      post_id TEXT NOT NULL,
      title TEXT,
      error_message TEXT,
      resolved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )
  `);
  
  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_automation_runs_created ON automation_runs(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_automation_errors_resolved ON automation_errors(resolved, created_at)`);
  
  console.log('Automation tracking tables created successfully');
};

module.exports = {
  createAutomationTables
};