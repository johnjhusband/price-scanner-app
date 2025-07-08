const sharp = require('sharp');
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);
const fs = require('fs').promises;
const path = require('path');

class UploadService {
  constructor() {
    // Local storage configuration
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.imageDir = path.join(this.uploadDir, 'images');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.baseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
    
    // Image constraints
    this.maxWidth = 2000;
    this.maxHeight = 2000;
    this.thumbnailSize = 300;
    this.quality = 85;
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  // Create upload directories if they don't exist
  async ensureDirectories() {
    try {
      await fs.mkdir(this.imageDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directories:', error);
    }
  }

  // Generate unique filename
  async generateFilename(originalName) {
    const timestamp = Date.now();
    const randomString = (await randomBytes(16)).toString('hex');
    const extension = originalName.toLowerCase().match(/\.[^.]+$/)?.[0] || '.jpg';
    return `${timestamp}-${randomString}${extension}`;
  }

  // Process and optimize image
  async processImage(buffer, options = {}) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Validate image
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      // Auto-orient based on EXIF data
      let processed = image.rotate();

      // Resize if needed
      if (metadata.width > this.maxWidth || metadata.height > this.maxHeight) {
        processed = processed.resize(this.maxWidth, this.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to JPEG for consistency and optimization
      processed = processed.jpeg({
        quality: options.quality || this.quality,
        progressive: true,
      });

      // Remove metadata for privacy
      processed = processed.withMetadata({
        exif: false,
        icc: false,
        iptc: false,
        xmp: false,
      });

      return await processed.toBuffer();
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  // Create thumbnail
  async createThumbnail(buffer) {
    try {
      const thumbnail = await sharp(buffer)
        .resize(this.thumbnailSize, this.thumbnailSize, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 80,
          progressive: true,
        })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      throw new Error('Failed to create thumbnail');
    }
  }

  // Save file to local storage
  async saveToLocal(buffer, filename, directory) {
    const filepath = path.join(directory, filename);
    
    try {
      await fs.writeFile(filepath, buffer);
      return {
        filename,
        filepath,
        size: buffer.length,
      };
    } catch (error) {
      console.error('Local storage error:', error);
      throw new Error('Failed to save file to storage');
    }
  }

  // Delete from local storage
  async deleteFromLocal(filename, directory) {
    const filepath = path.join(directory, filename);
    
    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  // Main upload handler
  async uploadImage(buffer, originalName, userId) {
    try {
      // Generate filename
      const filename = await this.generateFilename(originalName);

      // Process main image
      const processedImage = await this.processImage(buffer);
      
      // Create thumbnail
      const thumbnail = await this.createThumbnail(processedImage);

      // Save both to local storage
      const [imageResult, thumbnailResult] = await Promise.all([
        this.saveToLocal(processedImage, filename, this.imageDir),
        this.saveToLocal(thumbnail, filename, this.thumbnailDir),
      ]);

      // Generate URLs for accessing the files
      return {
        imageUrl: `${this.baseUrl}/images/${filename}`,
        thumbnailUrl: `${this.baseUrl}/thumbnails/${filename}`,
        imageKey: `images/${filename}`,
        thumbnailKey: `thumbnails/${filename}`,
        size: imageResult.size,
        thumbnailSize: thumbnailResult.size,
      };
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
    }
  }

  // Delete uploaded files
  async deleteUpload(imageKey, thumbnailKey) {
    try {
      // Extract filenames from keys
      const imageFilename = path.basename(imageKey);
      const thumbnailFilename = path.basename(thumbnailKey);

      const results = await Promise.all([
        this.deleteFromLocal(imageFilename, this.imageDir),
        this.deleteFromLocal(thumbnailFilename, this.thumbnailDir),
      ]);

      return results.every(result => result === true);
    } catch (error) {
      console.error('Delete upload error:', error);
      return false;
    }
  }

  // Virus scanning placeholder
  async scanForVirus(buffer) {
    // In production, integrate with ClamAV or similar
    // For now, just check file size and basic validation
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    
    if (buffer.length > MAX_SIZE) {
      throw new Error('File too large');
    }

    // Check for suspicious patterns (very basic)
    const suspicious = [
      Buffer.from('4D5A'), // EXE
      Buffer.from('504B0304'), // ZIP
      Buffer.from('7F454C46'), // ELF
    ];

    for (const pattern of suspicious) {
      if (buffer.slice(0, pattern.length).equals(pattern)) {
        throw new Error('Suspicious file content detected');
      }
    }

    return { safe: true };
  }

  // Cleanup old uploads
  async cleanupOldUploads(userId, keepLast = 100) {
    // In production, implement with database tracking
    // This would delete old uploads beyond the keep limit
    console.log(`Cleanup for user ${userId}, keeping last ${keepLast} uploads`);
  }

  // Get upload statistics
  async getStorageStats() {
    try {
      const imageFiles = await fs.readdir(this.imageDir);
      const thumbnailFiles = await fs.readdir(this.thumbnailDir);
      
      let totalSize = 0;
      
      // Calculate total size
      for (const file of imageFiles) {
        const stats = await fs.stat(path.join(this.imageDir, file));
        totalSize += stats.size;
      }
      
      for (const file of thumbnailFiles) {
        const stats = await fs.stat(path.join(this.thumbnailDir, file));
        totalSize += stats.size;
      }
      
      return {
        imageCount: imageFiles.length,
        thumbnailCount: thumbnailFiles.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        imageCount: 0,
        thumbnailCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
      };
    }
  }
}

// Export singleton instance
module.exports = new UploadService();