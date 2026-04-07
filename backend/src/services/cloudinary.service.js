/**
 * Cloudinary Service — Vendor-agnostic adapter for image storage.
 *
 * All Cloudinary SDK calls are isolated here so the rest of the
 * codebase depends on this interface, not the SDK directly.
 * If we ever switch to S3/R2/etc., only this file changes (R3 compliance).
 */
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

const FOLDER_PREFIX = 'vegaa';

const cloudinaryService = {
  /**
   * Upload an image from a public URL (e.g. Pexels).
   * Cloudinary will download and store it.
   *
   * @param {string} imageUrl - Public URL of the image to upload
   * @param {string} folder - Sub-folder name (e.g. 'destinations', 'avatars')
   * @param {string} [publicId] - Optional custom public ID (auto-generated if omitted)
   * @returns {Promise<{url: string, secureUrl: string, publicId: string, width: number, height: number}>}
   */
  async uploadFromUrl(imageUrl, folder = 'destinations', publicId = null) {
    try {
      const options = {
        folder: `${FOLDER_PREFIX}/${folder}`,
        resource_type: 'image',
        overwrite: true,
        // Auto-optimize on delivery
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(imageUrl, options);

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (err) {
      logger.error(`Cloudinary uploadFromUrl failed for ${imageUrl}:`, err.message);
      throw err;
    }
  },

  /**
   * Upload an image from a Buffer (e.g. user avatar file upload).
   *
   * @param {Buffer} buffer - Image file buffer
   * @param {string} folder - Sub-folder name
   * @param {string} [publicId] - Optional custom public ID
   * @returns {Promise<{url: string, secureUrl: string, publicId: string, width: number, height: number}>}
   */
  async uploadFromBuffer(buffer, folder = 'avatars', publicId = null) {
    return new Promise((resolve, reject) => {
      const options = {
        folder: `${FOLDER_PREFIX}/${folder}`,
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      };

      if (publicId) {
        options.public_id = publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) {
          logger.error('Cloudinary uploadFromBuffer failed:', err.message);
          return reject(err);
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      });

      uploadStream.end(buffer);
    });
  },

  /**
   * Delete an image by its public ID.
   *
   * @param {string} publicId - The Cloudinary public ID to delete
   * @returns {Promise<{result: string}>}
   */
  async delete(publicId) {
    try {
      if (!publicId) return { result: 'skipped' };
      const result = await cloudinary.uploader.destroy(publicId);
      logger.debug(`Cloudinary deleted: ${publicId} → ${result.result}`);
      return result;
    } catch (err) {
      logger.error(`Cloudinary delete failed for ${publicId}:`, err.message);
      // Don't throw — image deletion failure shouldn't break the caller
      return { result: 'error', error: err.message };
    }
  },

  /**
   * Generate an optimized delivery URL with transformations.
   *
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} options - Transformation options
   * @param {number} [options.width] - Resize width
   * @param {number} [options.height] - Resize height
   * @param {string} [options.crop] - Crop mode ('fill', 'fit', 'scale')
   * @param {string} [options.gravity] - Gravity for cropping ('auto', 'face', 'center')
   * @param {string} [options.quality] - Quality ('auto', 'auto:low', 'auto:best')
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, options = {}) {
    const transformations = [
      {
        quality: options.quality || 'auto',
        fetch_format: 'auto',
      },
    ];

    if (options.width || options.height) {
      transformations[0].width = options.width;
      transformations[0].height = options.height;
      transformations[0].crop = options.crop || 'fill';
      transformations[0].gravity = options.gravity || 'auto';
    }

    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformations,
    });
  },

  /**
   * Extract the public ID from a Cloudinary URL.
   * Returns null if the URL is not from Cloudinary.
   *
   * @param {string} url - Image URL to parse
   * @returns {string|null}
   */
  extractPublicId(url) {
    if (!url || !url.includes('res.cloudinary.com')) return null;

    try {
      // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<id>.<ext>
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if a URL is a Cloudinary URL.
   *
   * @param {string} url
   * @returns {boolean}
   */
  isCloudinaryUrl(url) {
    return !!url && url.includes('res.cloudinary.com');
  },
};

module.exports = cloudinaryService;
