const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database');

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
          helped_decision,
          feedback_text,
          user_description,
          image_data,
          scan_data
        ) VALUES (?, ?, ?, ?, ?)
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

module.exports = router;