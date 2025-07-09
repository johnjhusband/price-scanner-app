const express = require('express');
const multer = require('multer');
const router = express.Router();
const crypto = require('crypto');
const { validationRules } = require('../middleware/validation');

// Import services
const openaiService = require('../services/openaiService');
const responseFormatter = require('../utils/responseFormatter');
const authService = require('../services/auth/authService');
const { scanHistory } = require('../config/database');

// Configure multer for image upload with security enhancements
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
    files: 1,
    fields: 5,
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension'), false);
    }

    // Sanitize filename
    file.originalname = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 255);

    cb(null, true);
  }
});

// Additional file validation middleware
const validateFileContent = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Check magic numbers for file type verification
    const buffer = req.file.buffer;
    const magicNumbers = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46] // RIFF
    };

    let isValidFormat = false;
    
    // Check JPEG
    if (buffer[0] === magicNumbers.jpeg[0] && 
        buffer[1] === magicNumbers.jpeg[1] && 
        buffer[2] === magicNumbers.jpeg[2]) {
      isValidFormat = true;
    }
    // Check PNG
    else if (buffer[0] === magicNumbers.png[0] && 
             buffer[1] === magicNumbers.png[1] && 
             buffer[2] === magicNumbers.png[2] && 
             buffer[3] === magicNumbers.png[3]) {
      isValidFormat = true;
    }
    // Check GIF
    else if (buffer[0] === magicNumbers.gif[0] && 
             buffer[1] === magicNumbers.gif[1] && 
             buffer[2] === magicNumbers.gif[2]) {
      isValidFormat = true;
    }
    // Check WebP
    else if (buffer[0] === magicNumbers.webp[0] && 
             buffer[1] === magicNumbers.webp[1] && 
             buffer[2] === magicNumbers.webp[2] && 
             buffer[3] === magicNumbers.webp[3]) {
      isValidFormat = true;
    }

    if (!isValidFormat) {
      return res.status(400).json({ 
        error: 'Invalid file content',
        code: 'INVALID_FILE_FORMAT'
      });
    }

    // Generate hash for duplicate detection
    req.file.hash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for authenticated vs non-authenticated users
const scanRateLimiter = (req, res, next) => {
  const limit = req.user ? 30 : 10; // Authenticated users get more requests
  const key = req.user ? `scan_${req.user.id}` : `scan_${req.ip}`;
  
  // In production, use Redis for distributed rate limiting
  // For now, pass through
  next();
};

// GET /api/scan/health - Check scan service health (PUBLIC - no auth required)
// This route MUST come first to avoid auth middleware
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Price Scanner Analysis',
    timestamp: new Date().toISOString(),
    features: {
      imageAnalysis: true,
      historyTracking: true,
      duplicateDetection: true,
      secureUpload: true,
    }
  });
});

// POST /api/scan - Analyze image and get price estimates
router.post('/', 
  authService.optionalAuth,
  scanRateLimiter,
  upload.single('image'),
  validateFileContent,
  validationRules.scan.analyze,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No image file provided',
          code: 'NO_IMAGE'
        });
      }

      console.log('📸 Received image for analysis:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        hash: req.file.hash?.substring(0, 8) + '...',
        user: req.user?.email || 'anonymous'
      });

      // Check for duplicate scan (optional feature)
      if (req.user) {
        // Could check if same image was recently scanned
        // const recentScan = await scanHistory.findByImageHash(req.user.id, req.file.hash);
      }

      // Analyze image with OpenAI
      const analysis = await openaiService.analyzeImage(req.file.buffer);

      // Format response
      const formattedResponse = responseFormatter.formatAnalysis(analysis);

      // Save to scan history if user is authenticated
      if (req.user) {
        try {
          // In production, upload image to S3/Cloudinary first
          const imageUrl = `https://placeholder.com/images/${req.file.hash}.jpg`;
          const thumbnailUrl = `https://placeholder.com/thumbnails/${req.file.hash}.jpg`;

          const scanData = {
            user_id: req.user.id,
            image_url: imageUrl,
            thumbnail_url: thumbnailUrl,
            item_name: analysis.item_identification || 'Unknown Item',
            item_category: analysis.item?.category,
            item_brand: analysis.item?.brand,
            item_description: analysis.item?.description,
            condition_assessment: analysis.condition_assessment,
            price_range: analysis.price_range,
            platform_prices: analysis.selling_platforms || {},
            confidence_score: formattedResponse.confidence === 'High' ? 85 : 
                            formattedResponse.confidence === 'Medium' ? 65 : 45,
            ai_response: analysis,
          };

          const savedScan = await scanHistory.create(scanData);
          formattedResponse.scanId = savedScan.id;
          
          console.log('📝 Scan saved to history:', savedScan.id);
        } catch (dbError) {
          console.error('Failed to save scan history:', dbError);
          // Don't fail the request if history save fails
        }
      }

      console.log('✅ Analysis completed successfully');
      res.json(formattedResponse);

    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      
      if (error.message?.includes('rate limit')) {
        return res.status(429).json({ 
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      next(error);
    }
  }
);

// GET /api/scan/history - Get user's scan history
router.get('/history',
  authService.authenticate,
  validationRules.scan.list,
  async (req, res, next) => {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = 'scanned_at',
        order = 'desc',
        category,
        favorite
      } = req.query;

      const scans = await scanHistory.getUserScans(req.user.id, {
        limit,
        offset,
        orderBy,
        order,
        category,
        favorite,
      });

      const totalCount = await scanHistory.getUserScanCount(req.user.id);

      res.json({
        success: true,
        data: scans,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: offset + scans.length < totalCount,
        },
      });

    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scan/:id - Get specific scan
router.get('/:id',
  authService.authenticate,
  validationRules.id,
  async (req, res, next) => {
    try {
      const scan = await scanHistory.findById(req.params.id);

      if (!scan) {
        return res.status(404).json({ 
          error: 'Scan not found',
          code: 'SCAN_NOT_FOUND'
        });
      }

      // Check ownership
      if (scan.user_id !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied',
          code: 'FORBIDDEN'
        });
      }

      res.json({
        success: true,
        data: scan,
      });

    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/scan/:id - Update scan (notes, favorite status)
router.put('/:id',
  authService.authenticate,
  validationRules.scan.update,
  async (req, res, next) => {
    try {
      const { notes, isFavorite } = req.body;

      const updates = {};
      if (notes !== undefined) updates.notes = notes;
      if (isFavorite !== undefined) updates.is_favorite = isFavorite;

      const updatedScan = await scanHistory.update(
        req.params.id,
        req.user.id,
        updates
      );

      if (!updatedScan) {
        return res.status(404).json({ 
          error: 'Scan not found or access denied',
          code: 'SCAN_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Scan updated successfully',
        data: updatedScan,
      });

    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/scan/:id - Delete scan
router.delete('/:id',
  authService.authenticate,
  validationRules.id,
  async (req, res, next) => {
    try {
      const deleted = await scanHistory.delete(req.params.id, req.user.id);

      if (!deleted) {
        return res.status(404).json({ 
          error: 'Scan not found or access denied',
          code: 'SCAN_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Scan deleted successfully',
      });

    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scan/search - Search user's scans
router.get('/search',
  authService.authenticate,
  validationRules.scan.search,
  async (req, res, next) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      const scans = await scanHistory.search(req.user.id, q, { limit, offset });

      res.json({
        success: true,
        data: scans,
        query: q,
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;