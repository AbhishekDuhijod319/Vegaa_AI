const cloudinaryService = require('./cloudinary.service');
const tripService = require('./trip.service');
const authService = require('./auth.service');
const userRepository = require('../repositories/userRepository');
const tripRepository = require('../repositories/tripRepository');
const logger = require('../utils/logger');

const userService = {
  /**
   * Upload and update a user's avatar.
   */
  async updateAvatar(userId, imageBuffer, oldPictureUrl = '') {
    const publicId = `user_${userId}`;

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

  /**
   * Schedule account for deletion in 30 days.
   * User can cancel by logging in within the grace period.
   */
  async scheduleDeletion(userId) {
    const user = await userRepository.scheduleDeletion(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    logger.info(`Account deletion scheduled for user ${userId}. Will delete on ${user.deletionScheduledAt.toISOString()}`);

    return {
      deletionScheduledAt: user.deletionScheduledAt,
      message: `Account scheduled for deletion on ${user.deletionScheduledAt.toLocaleDateString()}. Log in within 30 days to cancel.`,
    };
  },

  /**
   * Cancel scheduled deletion (triggered on login or manually).
   */
  async cancelDeletion(userId) {
    const user = await userRepository.cancelDeletion(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    logger.info(`Account deletion cancelled for user ${userId}`);
    return user;
  },

  /**
   * Permanently delete a user account and all associated data.
   * Called by cleanup cron when grace period expires.
   *
   * Cascade: all trips → Cloudinary cover photos → avatar → refresh tokens → user doc
   */
  async performAccountDeletion(userId) {
    const user = await userRepository.findById(userId);
    if (!user) return;

    // 1. Get all user's trips (with tripData for cover photos)
    const Trip = require('../models/Trip');
    const trips = await Trip.find({ userId }).lean();

    // 2. Delete Cloudinary cover photos for each trip
    for (const trip of trips) {
      if (trip.coverPhotoUrl && cloudinaryService.isCloudinaryUrl(trip.coverPhotoUrl)) {
        try {
          const publicId = cloudinaryService.extractPublicId(trip.coverPhotoUrl);
          if (publicId) await cloudinaryService.delete(publicId);
        } catch (err) {
          logger.warn(`Failed to delete trip cover photo: ${err.message}`);
        }
      }
    }

    // 3. Delete all trips from MongoDB
    await Trip.deleteMany({ userId });

    // 4. Delete user avatar from Cloudinary
    if (user.picture && cloudinaryService.isCloudinaryUrl(user.picture)) {
      try {
        const publicId = cloudinaryService.extractPublicId(user.picture);
        if (publicId) await cloudinaryService.delete(publicId);
      } catch (err) {
        logger.warn(`Failed to delete user avatar: ${err.message}`);
      }
    }

    // 5. Revoke all refresh tokens
    await authService.revokeAllTokens(userId);

    // 6. Delete user document
    await userRepository.deleteById(userId);

    logger.info(`Account permanently deleted: ${userId} (${user.email}). Removed ${trips.length} trips.`);
  },

  /**
   * Cleanup all accounts whose deletion grace period has expired.
   * Call this from a scheduled cron job (e.g., daily).
   */
  async cleanupExpiredAccounts() {
    const expiredUsers = await userRepository.findScheduledForDeletion();
    logger.info(`Found ${expiredUsers.length} accounts past deletion grace period`);

    for (const user of expiredUsers) {
      try {
        await this.performAccountDeletion(user._id);
      } catch (err) {
        logger.error(`Failed to delete expired account ${user._id}: ${err.message}`);
      }
    }

    return expiredUsers.length;
  },
};

module.exports = userService;
