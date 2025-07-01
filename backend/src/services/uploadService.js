const AWS = require('aws-sdk');
const sharp = require('sharp');
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes);

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

class UploadService {
  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.cloudFrontUrl = process.env.CLOUDFRONT_URL;
    
    // Image constraints
    this.maxWidth = 2000;
    this.maxHeight = 2000;
    this.thumbnailSize = 300;
    this.quality = 85;
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

  // Upload to S3
  async uploadToS3(buffer, filename, contentType = 'image/jpeg') {
    const params = {
      Bucket: this.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private', // Use CloudFront for public access
      ServerSideEncryption: 'AES256',
      Metadata: {
        'uploaded-by': 'thrifting-buddy',
        'upload-date': new Date().toISOString(),
      },
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        key: result.Key,
        location: result.Location,
        etag: result.ETag,
        bucket: result.Bucket,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload to storage');
    }
  }

  // Generate signed URL for temporary access
  async generateSignedUrl(key, expiresIn = 3600) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn,
    };

    try {
      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error('Failed to generate access URL');
    }
  }

  // Delete from S3
  async deleteFromS3(key) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('S3 deletion error:', error);
      return false;
    }
  }

  // Main upload handler
  async uploadImage(buffer, originalName, userId) {
    try {
      // Generate filenames
      const imageFilename = await this.generateFilename(originalName);
      const thumbnailFilename = `thumbnails/${imageFilename}`;
      const fullImageFilename = `images/${imageFilename}`;

      // Process main image
      const processedImage = await this.processImage(buffer);
      
      // Create thumbnail
      const thumbnail = await this.createThumbnail(processedImage);

      // Upload both to S3
      const [imageUpload, thumbnailUpload] = await Promise.all([
        this.uploadToS3(processedImage, fullImageFilename),
        this.uploadToS3(thumbnail, thumbnailFilename),
      ]);

      // Generate URLs
      const baseUrl = this.cloudFrontUrl || `https://${this.bucketName}.s3.amazonaws.com`;
      
      return {
        imageUrl: `${baseUrl}/${fullImageFilename}`,
        thumbnailUrl: `${baseUrl}/${thumbnailFilename}`,
        imageKey: imageUpload.key,
        thumbnailKey: thumbnailUpload.key,
        size: processedImage.length,
        thumbnailSize: thumbnail.length,
      };
    } catch (error) {
      console.error('Upload service error:', error);
      throw error;
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
}

// Export singleton instance
module.exports = new UploadService();