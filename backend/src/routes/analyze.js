const express = require('express');
const router = express.Router();

// Import services
const openaiService = require('../services/openaiService');
const responseFormatter = require('../utils/responseFormatter');

// POST /api/analyze-base64 - Analyze base64 encoded image
router.post('/analyze-base64', async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('📸 Received base64 image for analysis:', {
      mimeType: mimeType || 'image/jpeg',
      dataLength: image.length
    });

    // Convert base64 to buffer
    const buffer = Buffer.from(image, 'base64');

    // Analyze image with OpenAI
    const analysis = await openaiService.analyzeImage(buffer);

    // Format response
    const formattedResponse = responseFormatter.formatAnalysis(analysis);

    console.log('✅ Analysis completed successfully');
    res.json(formattedResponse);

  } catch (error) {
    console.error('❌ Error analyzing base64 image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      message: error.message 
    });
  }
});

// POST /api/analyze - Alternative analyze endpoint (multipart)
router.post('/analyze', async (req, res) => {
  // Forward to scan route
  req.url = '/scan';
  router.handle(req, res);
});

module.exports = router;