const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create scan history table if it doesn't exist
function ensureScanHistoryTable() {
  const db = getDatabase();
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      price_range TEXT,
      style_tier TEXT,
      recommended_platform TEXT,
      recommended_live_platform TEXT,
      condition TEXT,
      authenticity_score TEXT,
      boca_score TEXT,
      buy_price TEXT,
      resale_average TEXT,
      market_insights TEXT,
      selling_tips TEXT,
      brand_context TEXT,
      seasonal_notes TEXT,
      user_description TEXT,
      image_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `;
  
  db.exec(createTableSQL);
  
  // Create index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scan_history_user_id 
    ON scan_history(user_id)
  `);
  
  console.log('Scan history table created/verified');
}

// Initialize table
try {
  ensureScanHistoryTable();
} catch (error) {
  console.error('Failed to create scan history table:', error);
}

// GET /api/scan-history - Get user's scan history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Get total count
    const totalCount = db.prepare(
      'SELECT COUNT(*) as count FROM scan_history WHERE user_id = ?'
    ).get(userId).count;
    
    // Get scan history
    const scans = db.prepare(`
      SELECT id, item_name, price_range, style_tier, 
             recommended_platform, recommended_live_platform,
             authenticity_score, boca_score, buy_price,
             created_at
      FROM scan_history 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
    
    res.json({
      success: true,
      data: {
        scans,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan history'
    });
  }
});

// GET /api/scan-history/:id - Get specific scan details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const scanId = req.params.id;
    const userId = req.user.id;
    
    const scan = db.prepare(`
      SELECT * FROM scan_history 
      WHERE id = ? AND user_id = ?
    `).get(scanId, userId);
    
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }
    
    res.json({
      success: true,
      data: scan
    });
    
  } catch (error) {
    console.error('Error fetching scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan details'
    });
  }
});

// DELETE /api/scan-history/:id - Delete a scan
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const scanId = req.params.id;
    const userId = req.user.id;
    
    const result = db.prepare(`
      DELETE FROM scan_history 
      WHERE id = ? AND user_id = ?
    `).run(scanId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scan'
    });
  }
});

// Helper function to save scan (called from main scan endpoint)
function saveScanToHistory(userId, scanData, userDescription = null) {
  try {
    const db = getDatabase();
    
    // Create a simple hash of the analysis for deduplication (optional)
    const crypto = require('crypto');
    const dataString = JSON.stringify(scanData);
    const imageHash = crypto.createHash('md5').update(dataString).digest('hex');
    
    const result = db.prepare(`
      INSERT INTO scan_history (
        user_id, item_name, price_range, style_tier,
        recommended_platform, recommended_live_platform,
        condition, authenticity_score, boca_score,
        buy_price, resale_average, market_insights,
        selling_tips, brand_context, seasonal_notes,
        user_description, image_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      scanData.item_name,
      scanData.price_range,
      scanData.style_tier,
      scanData.recommended_platform,
      scanData.recommended_live_platform || null,
      scanData.condition,
      scanData.authenticity_score,
      scanData.boca_score,
      scanData.buy_price || null,
      scanData.resale_average || null,
      scanData.market_insights,
      scanData.selling_tips,
      scanData.brand_context,
      scanData.seasonal_notes,
      userDescription,
      imageHash
    );
    
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error saving scan to history:', error);
    // Don't throw - let the scan complete even if history fails
    return null;
  }
}

module.exports = router;
module.exports.saveScanToHistory = saveScanToHistory;