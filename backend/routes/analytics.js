const express = require('express');
const { getDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary - Get user's scanning summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    // Get total scans
    const totalScans = db.prepare(
      'SELECT COUNT(*) as count FROM scan_history WHERE user_id = ?'
    ).get(userId).count;
    
    // Get scans by platform
    const platformStats = db.prepare(`
      SELECT 
        recommended_platform as platform,
        COUNT(*) as count,
        AVG(CAST(SUBSTR(boca_score, 1, LENGTH(boca_score)) AS INTEGER)) as avg_boca_score
      FROM scan_history 
      WHERE user_id = ?
      GROUP BY recommended_platform
      ORDER BY count DESC
    `).all(userId);
    
    // Get scans by style tier
    const styleTierStats = db.prepare(`
      SELECT 
        style_tier,
        COUNT(*) as count,
        AVG(CAST(REPLACE(REPLACE(resale_average, '$', ''), ',', '') AS INTEGER)) as avg_resale_value
      FROM scan_history 
      WHERE user_id = ?
      GROUP BY style_tier
      ORDER BY count DESC
    `).all(userId);
    
    // Get recent high-value finds
    const highValueFinds = db.prepare(`
      SELECT 
        item_name,
        price_range,
        buy_price,
        resale_average,
        boca_score,
        created_at
      FROM scan_history 
      WHERE user_id = ? 
        AND CAST(REPLACE(REPLACE(resale_average, '$', ''), ',', '') AS INTEGER) >= 100
      ORDER BY created_at DESC
      LIMIT 5
    `).all(userId);
    
    // Get scanning trends (last 30 days)
    const scanTrends = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as scan_count
      FROM scan_history 
      WHERE user_id = ? 
        AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all(userId);
    
    res.json({
      success: true,
      data: {
        totalScans,
        platformStats,
        styleTierStats,
        highValueFinds,
        scanTrends,
        memberSince: req.user.created_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// GET /api/analytics/search - Search scan history
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    // Get search parameters
    const { q, platform, style_tier, min_price, max_price, sort = 'created_at', order = 'DESC' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Build query dynamically
    let whereConditions = ['user_id = ?'];
    let params = [userId];
    
    if (q) {
      whereConditions.push(`(
        item_name LIKE ? OR 
        market_insights LIKE ? OR 
        selling_tips LIKE ? OR
        brand_context LIKE ? OR
        user_description LIKE ?
      )`);
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (platform) {
      whereConditions.push('recommended_platform = ?');
      params.push(platform);
    }
    
    if (style_tier) {
      whereConditions.push('style_tier = ?');
      params.push(style_tier);
    }
    
    if (min_price) {
      whereConditions.push("CAST(REPLACE(REPLACE(SUBSTR(price_range, 1, INSTR(price_range, '-') - 1), '$', ''), ',', '') AS INTEGER) >= ?");
      params.push(parseInt(min_price));
    }
    
    if (max_price) {
      whereConditions.push("CAST(REPLACE(REPLACE(SUBSTR(price_range, INSTR(price_range, '-') + 1), '$', ''), ',', '') AS INTEGER) <= ?");
      params.push(parseInt(max_price));
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Validate sort field
    const validSortFields = ['created_at', 'item_name', 'boca_score', 'resale_average'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM scan_history WHERE ${whereClause}`;
    const totalCount = db.prepare(countQuery).get(...params).count;
    
    // Get search results
    const searchQuery = `
      SELECT * FROM scan_history 
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    
    const results = db.prepare(searchQuery).all(...params);
    
    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error searching scans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search scans'
    });
  }
});

// GET /api/analytics/export - Export scan history as CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.id;
    
    const scans = db.prepare(`
      SELECT 
        item_name,
        price_range,
        style_tier,
        recommended_platform,
        recommended_live_platform,
        condition,
        authenticity_score,
        boca_score,
        buy_price,
        resale_average,
        created_at
      FROM scan_history 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    
    // Create CSV content
    const headers = [
      'Date',
      'Item',
      'Price Range',
      'Style Tier',
      'Best Platform',
      'Best Live Platform',
      'Condition',
      'Authenticity',
      'Boca Score',
      'Buy Price',
      'Resale Average'
    ];
    
    const csvRows = [headers.join(',')];
    
    scans.forEach(scan => {
      const row = [
        new Date(scan.created_at).toLocaleDateString(),
        `"${scan.item_name || ''}"`,
        scan.price_range || '',
        scan.style_tier || '',
        scan.recommended_platform || '',
        scan.recommended_live_platform || '',
        `"${scan.condition || ''}"`,
        scan.authenticity_score || '',
        scan.boca_score || '',
        scan.buy_price || '',
        scan.resale_average || ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="flippi-scan-history-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting scans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export scan history'
    });
  }
});

module.exports = router;