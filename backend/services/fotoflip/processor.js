const sharp = require('sharp');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const os = require('os');

class FotoFlipProcessor {
  constructor(config = {}) {
    this.openaiApiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    this.outputBgColor = config.outputBgColor || '#FAF6F1'; // Hermès cream
    this.tempDir = path.join(os.tmpdir(), 'fotoflip');
    this.watermarkText = 'flippi.ai ♻️';
    this.mode = config.mode || 'beautify';
  }

  /**
   * Main processing pipeline - Solution 11 Split Pipeline
   * @param {Buffer} imageBuffer - Input image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async processImage(imageBuffer, options = {}) {
    const startTime = Date.now();
    const processId = crypto.randomBytes(8).toString('hex');
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });
      
      // Auto-rotate based on EXIF
      imageBuffer = await sharp(imageBuffer).rotate().toBuffer();
      
      // Step 1: Local background removal
      const maskBuffer = await this.createMaskWithRembg(imageBuffer, processId);
      
      // Step 2: Create white background version
      const whiteBgBuffer = await this.compositeOnWhite(imageBuffer, maskBuffer);
      
      // Step 3: OpenAI beautification (if API key available)
      let processedBuffer = whiteBgBuffer;
      if (this.openaiApiKey) {
        try {
          processedBuffer = await this.beautifyWithOpenAI(whiteBgBuffer, maskBuffer);
        } catch (error) {
          console.error('OpenAI beautification failed, using local processing:', error.message);
          processedBuffer = await this.applyLocalEnhancements(whiteBgBuffer);
        }
      } else {
        processedBuffer = await this.applyLocalEnhancements(whiteBgBuffer);
      }
      
      // Step 4: Post-processing (brand background, enhancements)
      processedBuffer = await this.postprocessImage(processedBuffer);
      
      // Step 5: Add watermark (must be last)
      processedBuffer = await this.addWatermark(processedBuffer);
      
      // Cleanup temp files
      await this.cleanupTempFiles(processId);
      
      const processingTime = Date.now() - startTime;
      console.log(`FotoFlip processing completed in ${processingTime}ms`);
      
      return processedBuffer;
      
    } catch (error) {
      await this.cleanupTempFiles(processId);
      throw new Error(`FotoFlip processing failed: ${error.message}`);
    }
  }

  /**
   * Create mask using Python rembg
   * @param {Buffer} imageBuffer - Input image
   * @param {string} processId - Process identifier
   * @returns {Promise<Buffer>} Mask buffer
   */
  async createMaskWithRembg(imageBuffer, processId) {
    const tempImagePath = path.join(this.tempDir, `${processId}_input.jpg`);
    const tempMaskPath = path.join(this.tempDir, `${processId}_mask.png`);
    
    // Save input image
    await fs.writeFile(tempImagePath, imageBuffer);
    
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
from rembg import remove, new_session
from PIL import Image
import numpy as np

# Load image
input_path = sys.argv[1]
output_path = sys.argv[2]

# Create session
session = new_session()

# Remove background
with open(input_path, 'rb') as i:
    input_img = i.read()
    output = remove(input_img, session=session, only_mask=True)

# Save mask
with open(output_path, 'wb') as o:
    o.write(output)
`;
      
      const pythonProcess = spawn('python3', ['-c', pythonScript, tempImagePath, tempMaskPath]);
      
      let stderr = '';
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          reject(new Error(`rembg failed: ${stderr}`));
          return;
        }
        
        try {
          // Read and process mask
          let maskBuffer = await fs.readFile(tempMaskPath);
          
          // Apply feathering to mask
          maskBuffer = await sharp(maskBuffer)
            .blur(1.5) // 3px feather
            .toBuffer();
          
          resolve(maskBuffer);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Composite image on white background using mask
   * @param {Buffer} imageBuffer - Original image
   * @param {Buffer} maskBuffer - Alpha mask
   * @returns {Promise<Buffer>} White background image
   */
  async compositeOnWhite(imageBuffer, maskBuffer) {
    const metadata = await sharp(imageBuffer).metadata();
    
    // Extract object using mask
    const cutout = await sharp(imageBuffer)
      .ensureAlpha()
      .joinChannel(maskBuffer)
      .toBuffer();
    
    // Create white background
    const whiteBg = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
    
    // Composite cutout on white
    return sharp(whiteBg)
      .composite([{ input: cutout, blend: 'over' }])
      .png()
      .toBuffer();
  }

  /**
   * Apply OpenAI beautification
   * @param {Buffer} imageBuffer - White background image
   * @param {Buffer} maskBuffer - Mask for protection
   * @returns {Promise<Buffer>} Beautified image
   */
  async beautifyWithOpenAI(imageBuffer, maskBuffer) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: this.openaiApiKey });
    
    // Resize to 1024x1024 for OpenAI
    const resizedImage = await sharp(imageBuffer)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
    
    // Create full white mask to prevent background changes
    const whiteMask = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    }).png().toBuffer();
    
    // Prepare files for OpenAI
    const { toFile } = require('openai');
    const imageFile = await toFile(resizedImage, 'image.png', { type: 'image/png' });
    const maskFile = await toFile(whiteMask, 'mask.png', { type: 'image/png' });
    
    const prompt = this.mode === 'beautify' 
      ? "Enhance this product photo professionally: improve lighting, smooth imperfections, enhance colors and details. Make it magazine-quality while preserving the exact item. Pure white background."
      : "Make minimal adjustments to improve photo quality. Preserve exact appearance. Pure white background.";
    
    const response = await openai.images.edit({
      image: imageFile,
      mask: maskFile,
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });
    
    // Download result
    const resultUrl = response.data[0].url;
    const fetch = require('node-fetch');
    const imageResponse = await fetch(resultUrl);
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  /**
   * Apply local enhancements using Sharp
   * @param {Buffer} imageBuffer - Input image
   * @returns {Promise<Buffer>} Enhanced image
   */
  async applyLocalEnhancements(imageBuffer) {
    return sharp(imageBuffer)
      .modulate({
        brightness: 1.05,
        saturation: 1.1
      })
      .sharpen()
      .toBuffer();
  }

  /**
   * Post-process image with brand background and enhancements
   * @param {Buffer} imageBuffer - Input image
   * @returns {Promise<Buffer>} Post-processed image
   */
  async postprocessImage(imageBuffer) {
    const metadata = await sharp(imageBuffer).metadata();
    
    // If background color is not white, create cutout and recomposite
    if (this.outputBgColor !== '#FFFFFF') {
      // Create cutout by making white pixels transparent
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      const pixelCount = info.width * info.height;
      const cutout = Buffer.from(data);
      
      for (let i = 0; i < pixelCount; i++) {
        const idx = i * 4;
        const r = cutout[idx];
        const g = cutout[idx + 1];
        const b = cutout[idx + 2];
        
        // If pixel is very close to white, make it transparent
        if (r > 250 && g > 250 && b > 250) {
          cutout[idx + 3] = 0; // Set alpha to 0
        }
      }
      
      // Convert hex color to RGB
      const bgColor = this.hexToRgb(this.outputBgColor);
      
      // Create colored background
      const coloredBg = await sharp({
        create: {
          width: info.width,
          height: info.height,
          channels: 4,
          background: { r: bgColor.r, g: bgColor.g, b: bgColor.b, alpha: 1 }
        }
      }).png().toBuffer();
      
      // Create cutout image
      const cutoutImage = await sharp(cutout, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      }).png().toBuffer();
      
      // Composite on colored background
      imageBuffer = await sharp(coloredBg)
        .composite([{ input: cutoutImage, blend: 'over' }])
        .toBuffer();
    }
    
    // Apply additional enhancements
    imageBuffer = await this.enhanceLogosAndText(imageBuffer);
    imageBuffer = await this.brightenMetallicHardware(imageBuffer);
    
    return imageBuffer;
  }

  /**
   * Add watermark to image
   * @param {Buffer} imageBuffer - Input image
   * @returns {Promise<Buffer>} Watermarked image
   */
  async addWatermark(imageBuffer) {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;
    
    // Create watermark text
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <text x="${width - 120}" y="${height - 20}" 
              font-family="Helvetica, Arial, sans-serif" 
              font-size="18" 
              fill="gray" 
              opacity="0.65">
          ${this.watermarkText}
        </text>
      </svg>
    `;
    
    return sharp(imageBuffer)
      .composite([{
        input: Buffer.from(watermarkSvg),
        blend: 'over'
      }])
      .toBuffer();
  }

  /**
   * Enhance logos and text with unsharp mask
   */
  async enhanceLogosAndText(buffer) {
    return sharp(buffer)
      .sharpen({
        sigma: 1.0,
        m1: 0.7,
        m2: 0.3,
        x1: 2,
        y2: 10,
        y3: 20
      })
      .toBuffer();
  }

  /**
   * Brighten metallic hardware
   */
  async brightenMetallicHardware(buffer) {
    return sharp(buffer)
      .modulate({
        brightness: 1.03,
        saturation: 1.02
      })
      .toBuffer();
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempFiles(processId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const processFiles = files.filter(f => f.startsWith(processId));
      
      for (const file of processFiles) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

module.exports = FotoFlipProcessor;