import cloudinary from '../../config/cloudinary.js';
import { logger } from '../../utils/logger.js';

export class UploadService {
  /**
   * Upload file to Cloudinary
   */
  static async uploadFile(filePath, resourceType = 'auto') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'healthcare-assistant/uploads',
      });

      logger.info(`File uploaded successfully: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: result.original_filename,
        fileSize: result.bytes,
        fileType: result.resource_type,
      };
    } catch (error) {
      logger.error('File upload error:', error.message);
      throw error;
    }
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`File deleted successfully: ${publicId}`);
      return result;
    } catch (error) {
      logger.error('File deletion error:', error.message);
      throw error;
    }
  }

  /**
   * Get file info from Cloudinary
   */
  static async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Error getting file info:', error.message);
      throw error;
    }
  }
}
