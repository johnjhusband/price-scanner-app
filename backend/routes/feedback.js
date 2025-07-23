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
  console.log('\n=== ECHO ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({
    success: true,
    headers: req.headers,
    body: req.body,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : null
  });
});

// GET /api/feedback/health - Check if feedback system is working
router.get('/health', (req, res) => {
  console.log('\n=== FEEDBACK HEALTH CHECK ===');
  try {
    const db = getDatabase();
    console.log('Got database instance');
    
    const count = db.prepare('SELECT COUNT(*) as count FROM feedback').get();
    console.log('Query executed successfully, count:', count.count);
    
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
  console.log('\n=== FEEDBACK POST REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body received:', req.body ? 'Yes' : 'No');
  console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');
  
  if (req.body) {
    console.log('helped_decision:', req.body.helped_decision);
    console.log('feedback_text length:', req.body.feedback_text ? req.body.feedback_text.length : 'not provided');
    console.log('user_description length:', req.body.user_description ? req.body.user_description.length : 'not provided');
    console.log('image_data length:', req.body.image_data ? req.body.image_data.length : 'MISSING');
    console.log('scan_data:', req.body.scan_data ? 'Present' : 'MISSING');
    
    if (req.body.image_data) {
      console.log('image_data first 100 chars:', req.body.image_data.substring(0, 100));
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
      console.log('Database instance obtained successfully');
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
      console.log('SQL statement prepared successfully');
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
      console.log('Image buffer created, size:', imageBuffer.length);
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
      console.log(`Feedback saved with ID: ${result.lastInsertRowid}`);
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
  console.log('\n=== TEST BYPASS ENDPOINT HIT ===');
  
  try {
    // Log everything about the request
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body exists:', !!req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body:', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
    
    // Try to get database
    let db;
    try {
      db = getDatabase();
      console.log('Database obtained successfully');
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
      
      console.log('Test insert successful, ID:', result.lastInsertRowid);
      
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

module.exports = router;