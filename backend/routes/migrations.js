const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database');
const { createValuationTables } = require('../database/valuationSchema');

// Admin endpoint to run migrations
router.post('/api/admin/migrate/valuations', async (req, res) => {
  try {
    // Simple auth check - in production use proper admin auth
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_MIGRATION_KEY && adminKey !== 'flippi-migrate-2025') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('[Migration] Starting valuation tables creation...');
    
    const db = getDatabase();
    
    // Check if tables already exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'valuation%'").all();
    
    if (tables.length > 0) {
      console.log('[Migration] Tables already exist:', tables.map(t => t.name));
    }
    
    // Create tables
    createValuationTables(db);
    
    // Verify creation
    const newTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'valuation%'").all();
    
    console.log('[Migration] Tables after migration:', newTables.map(t => t.name));
    
    res.json({
      success: true,
      message: 'Valuation tables created successfully',
      tables: newTables.map(t => t.name),
      existing: tables.length > 0
    });
    
  } catch (error) {
    console.error('[Migration] Error:', error);
    res.status(500).json({
      error: 'Migration failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check migration status
router.get('/api/admin/migrate/status', async (req, res) => {
  try {
    const db = getDatabase();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    const valuationTables = tables.filter(t => t.name.includes('valuation'));
    const hasValuations = valuationTables.length > 0;
    
    res.json({
      success: true,
      has_valuation_tables: hasValuations,
      valuation_tables: valuationTables.map(t => t.name),
      all_tables: tables.map(t => t.name)
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check status',
      message: error.message
    });
  }
});

module.exports = router;