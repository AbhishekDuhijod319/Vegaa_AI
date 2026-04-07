const cloudinaryService = require('./cloudinary.service');
const logger = require('../utils/logger');

const userService = {
  /**
   * Upload and update a user's avatar.
   *
   * @param {string} userId - MongoDB user ID
   * @param {Buffer} imageBuffer - Raw image file buffer
   * @param {string} [oldPictureUrl] - Previous picture URL (for cleanup)
   * @returns {Promise<{secureUrl: string, publicId: string}>}
   */
  async updateAvatar(userId, imageBuffer, oldPictureUrl = '') {
    // Use the userId as the public ID so re-uploads overwrite the old avatar
    const publicId = `user_${userId}`;

    // Upload new avatar
    const result = await cloudinaryService.uploadFromBuffer(
      imageBuffer,
      'avatars',
      publicId
    );

    // Clean up old Cloudinary avatar if it exists and is different
    if (oldPictureUrl && cloudinaryService.isCloudinaryUrl(oldPictureUrl)) {
      const oldPublicId = cloudinaryService.extractPublicId(oldPictureUrl);
      if (oldPublicId && oldPublicId !== result.publicId) {
        await cloudinaryService.delete(oldPublicId);
      }
    }

    logger.info(`Avatar updated for user ${userId}: ${result.publicId}`);

    return {
      secureUrl: result.secureUrl,
      publicId: result.publicId,
    };
  },
};

module.exports = userService;
