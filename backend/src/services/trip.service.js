const tripRepository = require('../repositories/tripRepository');
const imageService = require('./image.service');
const cloudinaryService = require('./cloudinary.service');
const logger = require('../utils/logger');

const tripService = {
  async create({ userId, userEmail, userSelection, tripData, coverPhotoUrl, summary }) {
    const destination =
      userSelection?.destination?.label ||
      userSelection?.destination ||
      '';

    // Persist cover photo to Cloudinary (if it's a Pexels URL or empty)
    let persistedCoverUrl = coverPhotoUrl || '';

    if (persistedCoverUrl && !cloudinaryService.isCloudinaryUrl(persistedCoverUrl)) {
      // It's a Pexels URL — upload it to Cloudinary for permanence
      try {
        const result = await cloudinaryService.uploadFromUrl(
          persistedCoverUrl,
          'destinations',
          `trip_${destination.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`
        );
        persistedCoverUrl = result.secureUrl;
        logger.info(`Trip cover photo persisted: ${destination} → ${result.publicId}`);
      } catch (err) {
        logger.warn(`Failed to persist cover photo to Cloudinary: ${err.message}. Using original URL.`);
        // Keep the original URL as fallback
      }
    } else if (!persistedCoverUrl && destination) {
      // No cover photo provided — fetch and persist one via Pexels → Cloudinary
      try {
        const result = await imageService.searchAndPersist(destination, 'destinations');
        if (result?.secureUrl) {
          persistedCoverUrl = result.secureUrl;
        }
      } catch (err) {
        logger.warn(`Failed to auto-fetch cover photo: ${err.message}`);
      }
    }

    return tripRepository.create({
      userId,
      userEmail,
      destination,
      summary: summary || `Trip to ${destination}`,
      userSelection,
      tripData,
      coverPhotoUrl: persistedCoverUrl,
    });
  },

  async getById(tripId) {
    const trip = await tripRepository.getById(tripId);
    if (!trip) {
      const err = new Error('Trip not found.');
      err.status = 404;
      throw err;
    }
    return trip;
  },

  async listByUser(userId, options) {
    return tripRepository.getListByUserId(userId, options);
  },

  async update(tripId, userId, updateData) {
    // If updating coverPhotoUrl with a non-Cloudinary URL, persist it
    if (
      updateData.coverPhotoUrl &&
      !cloudinaryService.isCloudinaryUrl(updateData.coverPhotoUrl)
    ) {
      try {
        const result = await cloudinaryService.uploadFromUrl(
          updateData.coverPhotoUrl,
          'destinations',
          `trip_update_${Date.now()}`
        );
        updateData.coverPhotoUrl = result.secureUrl;
      } catch (err) {
        logger.warn(`Failed to persist updated cover photo: ${err.message}`);
      }
    }

    const trip = await tripRepository.update(tripId, userId, updateData);
    if (!trip) {
      const err = new Error('Trip not found or access denied.');
      err.status = 404;
      throw err;
    }
    return trip;
  },

  async delete(tripId, userId) {
    const trip = await tripRepository.delete(tripId, userId);
    if (!trip) {
      const err = new Error('Trip not found or access denied.');
      err.status = 404;
      throw err;
    }

    // Clean up Cloudinary image if it exists
    if (trip.coverPhotoUrl && cloudinaryService.isCloudinaryUrl(trip.coverPhotoUrl)) {
      const publicId = cloudinaryService.extractPublicId(trip.coverPhotoUrl);
      if (publicId) {
        await cloudinaryService.delete(publicId);
      }
    }

    return trip;
  },

  async getStats(userId) {
    const [count, destinations] = await Promise.all([
      tripRepository.countByUserId(userId),
      tripRepository.getUniqueDestinations(userId),
    ]);
    return { totalTrips: count, uniqueDestinations: destinations.length, destinations };
  },
};

module.exports = tripService;
