const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database');
const { analyzeUnprocessedFeedback } = require('../services/feedbackAnalyzer');
const { getFlaggedPatterns, resolvePattern } = require('../services/patternDetector');
const { createOverride, toggleOverride, getAllOverrides } = require('../services/overrideManager');
const { generateWeeklyReport, getLatestReport } = require('../services/reportGenerator');

// GET /api/feedback/test - Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Feedback API is reachable',
    timestamp: new Date().toISOString(),
    version: '2.0.1-fixed-tmp',
    expectedDbPath: '/tmp/flippi-feedback.db'
  });
});

// POST /api/feedback/echo - Echo back the request for debugging
router.post('/echo', (req, res) => {

  res.json({
    success: true,
    headers: req.headers,
    body: req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : null
  });
});

// GET /api/feedback/recent - Get recent feedback entries
router.get('/recent', (req, res) => {

  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 100;
    
    // Get recent feedback without the image blob for performance
    const feedback = db.prepare(`
      SELECT 
        id,
        helped_decision,
        feedback_text,
        user_description,
        scan_data,
        created_at
      FROM feedback 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
    
    // Parse scan_data JSON and format results
    const formattedFeedback = feedback.map(entry => ({
      ...entry,
      scan_data: entry.scan_data ? JSON.parse(entry.scan_data) : null,
      helped_decision: entry.helped_decision === 1 ? true : entry.helped_decision === 0 ? false : null
    }));
    
    res.json({
      success: true,
      count: formattedFeedback.length,
      feedback: formattedFeedback
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/last24hours - Get feedback from last 24 hours
router.get('/last24hours', (req, res) => {

  try {
    const db = getDatabase();
    
    // Get feedback from last 24 hours
    const feedback = db.prepare(`
      SELECT 
        id,
        helped_decision,
        feedback_text,
        user_description,
        scan_data,
        created_at
      FROM feedback 
      WHERE datetime(created_at) >= datetime('now', '-24 hours')
      ORDER BY created_at DESC
    `).all();
    
    // Parse scan_data JSON and format results
    const formattedFeedback = feedback.map(entry => ({
      ...entry,
      scan_data: entry.scan_data ? JSON.parse(entry.scan_data) : null,
      helped_decision: entry.helped_decision === 1 ? true : entry.helped_decision === 0 ? false : null
    }));
    
    res.json({
      success: true,
      count: formattedFeedback.length,
      period: 'last_24_hours',
      feedback: formattedFeedback
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/health - Check if feedback system is working
router.get('/health', (req, res) => {

  try {
    const db = getDatabase();

    const count = db.prepare('SELECT COUNT(*) as count FROM feedback').get();

    res.json({
      success: true,
      status: 'Feedback system operational',
      feedbackCount: count.count,
      databasePath: process.env.FEEDBACK_DB_PATH || '/tmp/flippi-feedback.db'
    });
  } catch (error) {
    console.error('Feedback health check error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      databasePath: process.env.FEEDBACK_DB_PATH || '/tmp/flippi-feedback.db'
    });
  }
});

// Validation rules
const feedbackValidation = [
  body('analysis_id')
    .notEmpty()
    .withMessage('analysis_id is required')
    .isString()
    .withMessage('analysis_id must be a string'),
  body('helped_decision')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('helped_decision must be a boolean or null'),
  body('feedback_text')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('feedback_text must be a string with max 500 characters'),
  body('user_description')
    .optional()
    .isString()
    .withMessage('user_description must be a string'),
  body('image_data')
    .notEmpty()
    .withMessage('image_data is required')
    .isString()
    .withMessage('image_data must be a string')
    .custom((value) => {
      // More lenient base64 check - just ensure it's a string with valid chars
      // Don't use isBase64() as it may fail on large strings
      if (typeof value !== 'string') return false;
      // Basic check for base64 characters
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      // For large strings, just check first and last 1000 chars
      if (value.length > 2000) {
        const start = value.substring(0, 1000);
        const end = value.substring(value.length - 1000);
        return base64Regex.test(start.replace(/=/g, '')) && 
               (end === '' || base64Regex.test(end));
      }
      return base64Regex.test(value);
    })
    .withMessage('image_data must be valid base64'),
  body('scan_data')
    .notEmpty()
    .withMessage('scan_data is required')
    .isObject()
    .withMessage('scan_data must be a valid object'),
  // Custom validation: at least one of helped_decision or feedback_text must be provided
  body().custom((body) => {
    if (body.helped_decision === null && !body.feedback_text) {
      throw new Error('Either helped_decision or feedback_text must be provided');
    }
    return true;
  })
];

// POST /api/feedback
router.post('/', feedbackValidation, (req, res) => {

  if (req.body) {

    if (req.body.image_data) {

    }
  }
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: errors.array()
      });
    }

    const {
      analysis_id,
      helped_decision,
      feedback_text,
      user_description,
      image_data,
      scan_data
    } = req.body;

    // Get database instance
    let db;
    try {
      db = getDatabase();

    } catch (dbError) {
      console.error('Failed to get database instance:', dbError);
      console.error('Database error stack:', dbError.stack);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

    // Prepare the insert statement
    let stmt;
    try {
      stmt = db.prepare(`
        INSERT INTO feedback (
          analysis_id,
          helped_decision,
          feedback_text,
          user_description,
          image_data,
          scan_data
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

    } catch (prepError) {
      console.error('Failed to prepare SQL statement:', prepError);
      return res.status(500).json({
        success: false,
        error: 'Database query preparation failed',
        details: process.env.NODE_ENV === 'development' ? prepError.message : undefined
      });
    }

    // Convert base64 to buffer for BLOB storage
    let imageBuffer;
    try {
      imageBuffer = Buffer.from(image_data, 'base64');

    } catch (bufferError) {
      console.error('Failed to create buffer from base64:', bufferError);
      return res.status(400).json({
        success: false,
        error: 'Invalid image data format',
        details: 'Image data must be valid base64'
      });
    }

    // Execute the insert
    let result;
    try {
      result = stmt.run(
        analysis_id,
        helped_decision === null ? null : (helped_decision ? 1 : 0),  // SQLite uses 0/1 for boolean, null for undefined
        feedback_text || null,
        user_description || null,
        imageBuffer,
        JSON.stringify(scan_data)
      );

    } catch (insertError) {
      console.error('Failed to insert feedback:', insertError);
      console.error('Insert error stack:', insertError.stack);
      return res.status(500).json({
        success: false,
        error: 'Failed to save feedback to database',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
      });
    }

    // Update user's feedback count if authenticated
    if (req.user?.id) {
      try {
        const userDb = getDatabase();
        userDb.prepare('UPDATE users SET feedback_count = feedback_count + 1 WHERE id = ?').run(req.user.id);
      } catch (userUpdateError) {
        console.error('Error updating user feedback count:', userUpdateError);
      }
    }

    res.json({
      success: true,
      message: 'Feedback received'
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/feedback/test-bypass - Test endpoint with NO validation
router.post('/test-bypass', (req, res) => {

  try {
    // Log everything about the request

    // Try to get database
    let db;
    try {
      db = getDatabase();

    } catch (dbErr) {
      console.error('Database error:', dbErr.message);
      return res.status(500).json({
        success: false,
        error: 'Database not available',
        details: dbErr.message
      });
    }
    
    // Try a simple insert with minimal data
    try {
      const stmt = db.prepare(`
        INSERT INTO feedback (
          helped_decision,
          feedback_text,
          user_description,
          image_data,
          scan_data
        ) VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        1, // helped_decision = true
        'Test bypass feedback',
        'Test description',
        Buffer.from('test', 'utf8'), // Small test buffer
        JSON.stringify({ test: true })
      );

      res.json({
        success: true,
        message: 'Test bypass successful',
        id: result.lastInsertRowid
      });
    } catch (insertErr) {
      console.error('Insert error:', insertErr.message);
      console.error('Insert stack:', insertErr.stack);
      return res.status(500).json({
        success: false,
        error: 'Insert failed',
        details: insertErr.message
      });
    }
    
  } catch (error) {
    console.error('Test bypass error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Test bypass failed',
      details: error.message
    });
  }
});

// GET /api/feedback/list - Retrieve all feedback entries
router.get('/list', (req, res) => {

  try {
    const db = getDatabase();
    
    // Get all feedback entries, most recent first
    const feedbackList = db.prepare(`
      SELECT 
        id,
        helped_decision,
        feedback_text,
        user_description,
        json_extract(scan_data, '$.item_name') as item_name,
        json_extract(scan_data, '$.price_range') as price_range,
        json_extract(scan_data, '$.trending_score') as trending_score,
        json_extract(scan_data, '$.trending_label') as trending_label,
        created_at
      FROM feedback 
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    
    // Convert helped_decision from 0/1 to boolean
    const formattedList = feedbackList.map(entry => ({
      ...entry,
      helped_decision: entry.helped_decision === 1 ? 'Yes' : entry.helped_decision === 0 ? 'No' : 'Not answered'
    }));
    
    res.json({
      success: true,
      count: formattedList.length,
      feedback: formattedList
    });
    
  } catch (error) {
    console.error('Error retrieving feedback list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/feedback/analyze - Trigger GPT analysis on unprocessed feedback
router.post('/analyze', async (req, res) => {
  try {
    console.log('Starting feedback analysis...');
    const result = await analyzeUnprocessedFeedback();
    
    res.json({
      success: result.success,
      message: `Analyzed ${result.processed || 0} feedback entries`,
      details: result
    });
  } catch (error) {
    console.error('Error in analyze endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/admin - Admin view with analyzed feedback
router.get('/admin', (req, res) => {
  try {
    const db = getDatabase();
    const limit = parseInt(req.query.limit) || 100;
    const category = req.query.category;
    const sentiment = req.query.sentiment;
    
    let query = `
      SELECT 
        f.id,
        f.analysis_id,
        f.helped_decision,
        f.feedback_text,
        f.user_description,
        f.created_at,
        fa.sentiment,
        fa.category,
        fa.suggestion_type,
        fa.summary,
        fa.analyzed_at,
        json_extract(f.scan_data, '$.item_name') as item_name,
        json_extract(f.scan_data, '$.price_range') as price_range,
        json_extract(f.scan_data, '$.real_score') as real_score,
        json_extract(f.scan_data, '$.trending_score') as trending_score
      FROM feedback f
      LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      query += ' AND fa.category = ?';
      params.push(category);
    }
    
    if (sentiment) {
      query += ' AND fa.sentiment = ?';
      params.push(sentiment);
    }
    
    query += ' ORDER BY f.created_at DESC LIMIT ?';
    params.push(limit);
    
    const feedbackData = db.prepare(query).all(...params);
    
    // Format the data
    const formattedData = feedbackData.map(entry => ({
      ...entry,
      helped_decision: entry.helped_decision === 1 ? 'Yes' : entry.helped_decision === 0 ? 'No' : 'Not answered',
      is_analyzed: !!entry.sentiment
    }));
    
    // Get summary statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_feedback,
        SUM(CASE WHEN helped_decision = 1 THEN 1 ELSE 0 END) as positive_feedback,
        SUM(CASE WHEN helped_decision = 0 THEN 1 ELSE 0 END) as negative_feedback,
        COUNT(DISTINCT fa.id) as analyzed_count
      FROM feedback f
      LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
    `).get();
    
    // Get category breakdown
    const categoryBreakdown = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM feedback_analysis
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `).all();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        positive_rate: stats.total_feedback > 0 
          ? ((stats.positive_feedback / stats.total_feedback) * 100).toFixed(1) + '%'
          : '0%'
      },
      category_breakdown: categoryBreakdown,
      feedback: formattedData
    });
    
  } catch (error) {
    console.error('Error in admin endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/export - Export feedback data for ML training
router.get('/export', (req, res) => {
  try {
    const db = getDatabase();
    const format = req.query.format || 'json'; // json or csv
    
    const exportData = db.prepare(`
      SELECT 
        f.*,
        fa.sentiment,
        fa.category,
        fa.suggestion_type,
        fa.summary
      FROM feedback f
      LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
      ORDER BY f.created_at DESC
    `).all();
    
    // Parse scan_data for each entry
    const processedData = exportData.map(entry => ({
      ...entry,
      scan_data: JSON.parse(entry.scan_data),
      image_data: undefined // Remove blob data from export
    }));
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader = 'id,analysis_id,helped_decision,feedback_text,sentiment,category,suggestion_type,summary,item_name,price_range,real_score,created_at\n';
      const csvRows = processedData.map(row => {
        const scanData = row.scan_data;
        return [
          row.id,
          row.analysis_id,
          row.helped_decision,
          `"${(row.feedback_text || '').replace(/"/g, '""')}"`,
          row.sentiment || '',
          row.category || '',
          row.suggestion_type || '',
          `"${(row.summary || '').replace(/"/g, '""')}"`,
          `"${(scanData.item_name || '').replace(/"/g, '""')}"`,
          scanData.price_range || '',
          scanData.real_score || '',
          row.created_at
        ].join(',');
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${Date.now()}.csv`);
      res.send(csvHeader + csvRows);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=feedback-export-${Date.now()}.json`);
      res.json({
        export_date: new Date().toISOString(),
        total_entries: processedData.length,
        data: processedData
      });
    }
    
  } catch (error) {
    console.error('Error exporting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback/patterns - Get flagged patterns
router.get('/patterns', async (req, res) => {
  try {
    const patterns = await getFlaggedPatterns();
    res.json({
      success: true,
      patterns: patterns
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns'
    });
  }
});

// POST /api/feedback/patterns/:id/resolve - Resolve a pattern
router.post('/patterns/:id/resolve', async (req, res) => {
  try {
    const result = await resolvePattern(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error resolving pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve pattern'
    });
  }
});

// GET /api/feedback/overrides - Get all overrides
router.get('/overrides', async (req, res) => {
  try {
    const overrides = await getAllOverrides();
    res.json({
      success: true,
      overrides: overrides
    });
  } catch (error) {
    console.error('Error fetching overrides:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overrides'
    });
  }
});

// POST /api/feedback/overrides - Create new override
router.post('/overrides', async (req, res) => {
  try {
    const result = await createOverride(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create override'
    });
  }
});

// PUT /api/feedback/overrides/:id/toggle - Toggle override active status
router.put('/overrides/:id/toggle', async (req, res) => {
  try {
    const result = await toggleOverride(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Error toggling override:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle override'
    });
  }
});

// POST /api/feedback/reports/generate - Generate weekly report
router.post('/reports/generate', async (req, res) => {
  try {
    const report = await generateWeeklyReport();
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// GET /api/feedback/reports/latest - Get latest report
router.get('/reports/latest', async (req, res) => {
  try {
    const report = await getLatestReport();
    if (report) {
      res.json({
        success: true,
        report: report
      });
    } else {
      res.json({
        success: true,
        report: null,
        message: 'No reports available yet'
      });
    }
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report'
    });
  }
});

// GET /admin/user-activity-summary - Get user activity stats for admin dashboard
router.get('/admin/user-activity-summary', (req, res) => {
  try {
    const db = getDatabase();
    
    // Get user activity data with obfuscated emails
    const users = db.prepare(`
      SELECT 
        id,
        CASE 
          WHEN LENGTH(email) > 3 THEN 
            SUBSTR(email, 1, 1) || '***@' || SUBSTR(email, INSTR(email, '@') + 1)
          ELSE email
        END as email_obfuscated,
        name,
        login_count,
        scan_count,
        feedback_count,
        first_login,
        last_login,
        CASE 
          WHEN scan_count > 100 OR feedback_count > 20 OR login_count > 15 THEN 1
          ELSE 0
        END as is_high_value
      FROM users
      ORDER BY last_login DESC
      LIMIT 100
    `).all();
    
    // Get summary statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN login_count > 1 THEN 1 ELSE 0 END) as returning_users,
        SUM(CASE WHEN scan_count > 100 OR feedback_count > 20 OR login_count > 15 THEN 1 ELSE 0 END) as high_value_users,
        AVG(scan_count) as avg_scans_per_user,
        AVG(feedback_count) as avg_feedback_per_user,
        MAX(scan_count) as max_scans,
        MAX(feedback_count) as max_feedback
      FROM users
    `).get();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        avg_scans_per_user: Math.round(stats.avg_scans_per_user || 0),
        avg_feedback_per_user: Math.round(stats.avg_feedback_per_user || 0)
      },
      users: users
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity data'
    });
  }
});

module.exports = router;