const FotoFlipProcessor = require('./processor');
const ImgBBUploader = require('./imgbb-uploader');
const crypto = require('crypto');

class FotoFlipService {
  constructor() {
    this.processor = new FotoFlipProcessor({
      openaiApiKey: process.env.OPENAI_API_KEY,
      outputBgColor: process.env.FOTOFLIP_BG_COLOR || '#FAF6F1',
      mode: process.env.FOTOFLIP_MODE || 'beautify'
    });
    
    // Initialize ImgBB uploader if API key is available
    this.uploader = process.env.IMGBB_API_KEY 
      ? new ImgBBUploader(process.env.IMGBB_API_KEY)
      : null;
  }

  /**
   * Process a single image through the FotoFlip pipeline
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Result with processed image URL or base64
   */
  async processLuxePhoto(imageBuffer, options = {}) {
    try {
      // Validate input
      if (!Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image buffer provided');
      }

      // Generate unique identifier for this processing job
      const jobId = crypto.randomBytes(8).toString('hex');
      console.log(`Starting FotoFlip Luxe Photo processing - Job ID: ${jobId}`);

      // Process image through FotoFlip pipeline
      const processedBuffer = await this.processor.processImage(imageBuffer, {
        jobId,
        ...options
      });

      // Decide on return format
      if (this.uploader && options.returnUrl !== false) {
        // Upload to ImgBB and return URL
        const uploadResult = await this.uploader.uploadImage(
          processedBuffer,
          `luxe-photo-${jobId}`
        );
        
        return {
          success: true,
          jobId,
          url: uploadResult.url,
          displayUrl: uploadResult.displayUrl,
          deleteUrl: uploadResult.deleteUrl,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.size,
          expiration: uploadResult.expiration
        };
      } else {
        // Return as base64 (fallback or if no ImgBB configured)
        const base64Image = processedBuffer.toString('base64');
        const mimeType = 'image/png';
        
        return {
          success: true,
          jobId,
          base64: base64Image,
          mimeType,
          dataUrl: `data:${mimeType};base64,${base64Image}`,
          size: processedBuffer.length
        };
      }
    } catch (error) {
      console.error('FotoFlip Luxe Photo processing error:', error);
      throw error;
    }
  }

  /**
   * Health check to verify service is configured properly
   * @returns {Object} Service health status
   */
  async healthCheck() {
    const health = {
      service: 'FotoFlip',
      status: 'healthy',
      features: {
        backgroundRemoval: true,
        beautification: !!process.env.OPENAI_API_KEY,
        imageHosting: !!process.env.IMGBB_API_KEY,
        watermarking: true
      },
      config: {
        mode: process.env.FOTOFLIP_MODE || 'beautify',
        backgroundColor: process.env.FOTOFLIP_BG_COLOR || '#FAF6F1',
        returnFormat: this.uploader ? 'url' : 'base64'
      }
    };

    // Check Python dependencies
    try {
      const { spawn } = require('child_process');
      
      // Use Python path from environment or default
      const pythonPath = process.env.FOTOFLIP_PYTHON || 'python3';
      
      const pythonCheck = spawn(pythonPath, ['-c', 'import rembg; print("OK")']);
      
      await new Promise((resolve, reject) => {
        pythonCheck.on('close', (code) => {
          if (code === 0) {
            health.features.pythonRembg = true;
            resolve();
          } else {
            health.features.pythonRembg = false;
            health.warnings = health.warnings || [];
            health.warnings.push('Python rembg not installed - background removal will fail');
            resolve();
          }
        });
      });
    } catch (error) {
      health.features.pythonRembg = false;
      health.warnings = health.warnings || [];
      health.warnings.push('Python not available');
    }

    return health;
  }

  /**
   * Extract metadata from an image (for future AutoFlip integration)
   * @param {Buffer} imageBuffer - Input image buffer
   * @returns {Promise<Object>} Extracted metadata
   */
  async extractMetadata(imageBuffer) {
    if (!process.env.OPENAI_API_KEY) {
      return {
        brand: 'Unknown',
        model: '',
        color: '',
        material: '',
        condition: '5',
        conditionText: 'Good',
        category: 'bag',
        suggestedPrice: '50'
      };
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    try {
      // Convert image to base64 for OpenAI
      const base64Image = imageBuffer.toString('base64');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product photo and extract:
                - Brand name (or 'Unknown' if not visible)
                - Model/style name
                - Primary color
                - Material (leather, canvas, synthetic, etc.)
                - Size estimate (small/medium/large)
                - Condition (1-10 scale: 10=new, 8=excellent, 5=good, 3=fair, 1=poor)
                - Item category (bag, wallet, shoes, etc.)
                - Suggested resale price in USD
                - Original MSRP if known
                
                Respond in JSON format only.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      const metadata = JSON.parse(content);
      
      return {
        brand: metadata.brand || 'Unknown',
        model: metadata.model || '',
        color: metadata.color || '',
        material: metadata.material || '',
        size: metadata.size || '',
        condition: metadata.condition || '5',
        conditionText: this.getConditionText(metadata.condition || 5),
        category: metadata.category || 'bag',
        suggestedPrice: metadata.suggested_price || '50',
        msrp: metadata.msrp || 'unknown'
      };
    } catch (error) {
      console.error('Metadata extraction failed:', error);
      return this.getDefaultMetadata();
    }
  }

  getConditionText(condition) {
    const conditionNum = parseInt(condition);
    if (conditionNum >= 9) return 'New With Tags';
    if (conditionNum >= 8) return 'Excellent';
    if (conditionNum >= 6) return 'Very Good';
    if (conditionNum >= 4) return 'Good';
    if (conditionNum >= 2) return 'Fair';
    return 'Poor';
  }

  getDefaultMetadata() {
    return {
      brand: 'Unknown',
      model: '',
      color: '',
      material: '',
      condition: '5',
      conditionText: 'Good',
      category: 'bag',
      suggestedPrice: '50'
    };
  }
}

// Export singleton instance
module.exports = new FotoFlipService();