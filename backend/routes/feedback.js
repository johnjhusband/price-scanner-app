const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database');

// GET /api/feedback/health - Check if feedback system is working
router.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    const count = db.prepare('SELECT COUNT(*) as count FROM feedback').get();
    res.json({
      success: true,
      status: 'Feedback system operational',
      feedbackCount: count.count,
      databasePath: process.env.FEEDBACK_DB_PATH || './feedback.db'
    });
  } catch (error) {
    console.error('Feedback health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      databasePath: process.env.FEEDBACK_DB_PATH || './feedback.db'
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
    .isBase64()
    .withMessage('image_data must be base64 encoded'),
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
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
    const db = getDatabase();

    // Prepare the insert statement
    const stmt = db.prepare(`
      INSERT INTO feedback (
        helped_decision,
        feedback_text,
        user_description,
        image_data,
        scan_data
      ) VALUES (?, ?, ?, ?, ?)
    `);

    // Convert base64 to buffer for BLOB storage
    const imageBuffer = Buffer.from(image_data, 'base64');

    // Execute the insert
    const result = stmt.run(
      helped_decision === null ? null : (helped_decision ? 1 : 0),  // SQLite uses 0/1 for boolean, null for undefined
      feedback_text || null,
      user_description || null,
      imageBuffer,
      JSON.stringify(scan_data)
    );

    console.log(`Feedback saved with ID: ${result.lastInsertRowid}`);

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

module.exports = router;