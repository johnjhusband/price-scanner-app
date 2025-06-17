const express = require('express');
const multer = require('multer');
const { analyzeImage } = require('../services/openaiService');
const { formatResponse } = require('../utils/responseFormatter');

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// POST /api/analyze - Analyze image for price estimation
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log(`📸 Analyzing image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Convert buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Analyze image with OpenAI
    const analysis = await analyzeImage(imageBase64, mimeType);

    // Format and return response
    const formattedResponse = formatResponse(analysis);
    
    console.log('✅ Analysis completed successfully');
    res.json({
      success: true,
      data: formattedResponse
    });

  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/analyze-base64 - Alternative endpoint for base64 images
router.post('/analyze-base64', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    console.log('📸 Analyzing base64 image');

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Analyze image with OpenAI
    const analysis = await analyzeImage(base64Data, mimeType);

    // Format and return response
    const formattedResponse = formatResponse(analysis);
    
    console.log('✅ Analysis completed successfully');
    res.json({
      success: true,
      data: formattedResponse
    });

  } catch (error) {
    console.error('❌ Error analyzing image:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 