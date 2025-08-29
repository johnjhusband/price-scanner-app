const fetch = require('node-fetch');
const FormData = require('form-data');

class ImgBBUploader {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('ImgBB API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.imgbb.com/1/upload';
  }

  /**
   * Upload image buffer to ImgBB
   * @param {Buffer} imageBuffer - Image buffer to upload
   * @param {string} name - Optional name for the image
   * @returns {Promise<Object>} Upload response with URL
   */
  async uploadImage(imageBuffer, name = null) {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare form data
      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('image', base64Image);
      
      if (name) {
        formData.append('name', name);
      }
      
      // Set expiration to 6 months (in seconds)
      // This gives users plenty of time to download while not storing forever
      formData.append('expiration', '15552000');
      
      console.log(`Uploading image to ImgBB...`);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`ImgBB upload failed: ${result.error?.message || 'Unknown error'}`);
      }
      
      console.log(`✓ Image uploaded successfully: ${result.data.url}`);
      
      return {
        url: result.data.url,
        displayUrl: result.data.display_url,
        deleteUrl: result.data.delete_url,
        size: result.data.size,
        expiration: result.data.expiration,
        name: result.data.title,
        width: result.data.width,
        height: result.data.height
      };
      
    } catch (error) {
      console.error('ImgBB upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete image from ImgBB
   * @param {string} deleteUrl - Delete URL returned from upload
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(deleteUrl) {
    try {
      const response = await fetch(deleteUrl, { method: 'GET' });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('ImgBB delete error:', error);
      return false;
    }
  }
}

module.exports = ImgBBUploader;