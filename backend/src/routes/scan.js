const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import services
const openaiService = require('../services/openaiService');
const responseFormatter = require('../utils/responseFormatter');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/scan - Analyze image and get price estimates
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('📸 Received image for analysis:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Analyze image with OpenAI
    const analysis = await openaiService.analyzeImage(req.file.buffer);

    // Format response
    const formattedResponse = responseFormatter.formatAnalysis(analysis);

    console.log('✅ Analysis completed successfully');
    res.json(formattedResponse);

  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      message: error.message 
    });
  }
});

// GET /api/scan/health - Check scan service health
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Price Scanner Analysis',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 