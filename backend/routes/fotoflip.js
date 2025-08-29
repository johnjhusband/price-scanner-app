const express = require('express');
const router = express.Router();
const multer = require('multer');
const fotoflipService = require('../services/fotoflip');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Health check endpoint for FotoFlip service
 */
router.get('/health', async (req, res) => {
  try {
    const health = await fotoflipService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      service: 'FotoFlip',
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Process image through FotoFlip Luxe Photo pipeline
 */
router.post('/luxe-photo', upload.single('image'), async (req, res) => {
  try {
    // Check if feature is enabled (Blue environment only)
    const isBlueEnvironment = process.env.ENVIRONMENT === 'blue' || 
                             process.env.NODE_ENV === 'development';
    const luxePhotoEnabled = process.env.ENABLE_LUXE_PHOTO === 'true';
    
    if (!isBlueEnvironment || !luxePhotoEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Luxe Photo feature is not available in this environment'
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log(`Processing Luxe Photo - Size: ${req.file.size} bytes, Type: ${req.file.mimetype}`);

    // Process image
    const result = await fotoflipService.processLuxePhoto(req.file.buffer, {
      returnUrl: true, // Return URL if ImgBB is configured
      originalName: req.file.originalname
    });

    // Send successful response
    res.json(result);

  } catch (error) {
    console.error('Luxe Photo endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
      message: error.message
    });
  }
});

/**
 * Extract metadata from image (for future AutoFlip integration)
 */
router.post('/extract-metadata', upload.single('image'), async (req, res) => {
  try {
    // This endpoint could be used in the future for AutoFlip cloud integration
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const metadata = await fotoflipService.extractMetadata(req.file.buffer);
    
    res.json({
      success: true,
      metadata
    });

  } catch (error) {
    console.error('Metadata extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract metadata',
      message: error.message
    });
  }
});

/**
 * Process image and return as base64 (alternative to URL)
 */
router.post('/process-base64', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Process and return as base64
    const result = await fotoflipService.processLuxePhoto(req.file.buffer, {
      returnUrl: false // Force base64 return
    });

    res.json(result);

  } catch (error) {
    console.error('Base64 processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
      message: error.message
    });
  }
});

module.exports = router;