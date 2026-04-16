const tripRepository = require('../repositories/tripRepository');
const imageService = require('./image.service');
const cloudinaryService = require('./cloudinary.service');
const aiService = require('./ai.service');
const crypto = require('crypto');
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
      }
    } else if (!persistedCoverUrl && destination) {
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

  /**
   * Regenerate trip data using AI based on updated userSelection,
   * then persist the new tripData + userSelection + cover photo.
   */
  async regenerateAndUpdate(tripId, userId, userSelection) {
    // 1. Verify ownership
    const existingTrip = await tripRepository.getById(tripId);
    if (!existingTrip) {
      const err = new Error('Trip not found.');
      err.status = 404;
      throw err;
    }
    if (existingTrip.userId?.toString() !== userId) {
      const err = new Error('Access denied.');
      err.status = 403;
      throw err;
    }

    // 2. Extract params from userSelection for AI
    const destination =
      userSelection?.destination?.label ||
      userSelection?.destination ||
      '';
    const startLocation =
      userSelection?.startLocation?.label ||
      userSelection?.startLocation ||
      '';

    const startDate = userSelection?.startDate || '';
    const endDate = userSelection?.endDate || '';
    let totalDays = userSelection?.noOfDays || 3;

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) totalDays = diff;
    }

    const travelers = userSelection?.numTravelers || 1;
    const budget = userSelection?.amount || 0;
    const currency = userSelection?.currency || 'INR';
    const transportMode = userSelection?.transportMode || '';

    logger.info(`Regenerating trip ${tripId} for destination: ${destination} (${totalDays} days)`);

    // 3. Call AI to regenerate
    const tripData = await aiService.generateTrip({
      destination,
      startLocation,
      totalDays,
      travelers,
      budget,
      currency,
      transportMode,
      startDate,
      endDate,
    });

    // 4. Fetch new cover photo if destination changed
    let coverPhotoUrl = existingTrip.coverPhotoUrl || '';
    const oldDestination =
      existingTrip.userSelection?.destination?.label ||
      existingTrip.userSelection?.destination ||
      '';

    if (destination && destination !== oldDestination) {
      try {
        const imgResult = await imageService.searchAndPersist(destination, 'destinations');
        if (imgResult?.secureUrl) {
          coverPhotoUrl = imgResult.secureUrl;
        }
      } catch (err) {
        logger.warn(`Failed to fetch new cover photo during regeneration: ${err.message}`);
      }
    }

    // 5. Persist updated trip
    const updated = await tripRepository.update(tripId, userId, {
      userSelection: { ...userSelection, noOfDays: totalDays },
      tripData,
      coverPhotoUrl,
      destination,
      summary: tripData?.tripSummary?.title || `Trip to ${destination}`,
      status: 'generated',
    });

    if (!updated) {
      const err = new Error('Failed to update trip after regeneration.');
      err.status = 500;
      throw err;
    }

    logger.info(`Trip ${tripId} regenerated successfully for ${destination}`);
    return updated;
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

  /**
   * Generate a unique share token for a trip (owner only).
   * Returns the updated trip with the shareToken set.
   */
  async generateShareToken(tripId, userId) {
    // First verify ownership
    const trip = await tripRepository.getById(tripId);
    if (!trip) {
      const err = new Error('Trip not found.');
      err.status = 404;
      throw err;
    }
    if (trip.userId?.toString() !== userId) {
      const err = new Error('Access denied. Only the trip owner can generate share links.');
      err.status = 403;
      throw err;
    }

    // Generate a URL-safe random token if one doesn't exist
    if (!trip.shareToken) {
      const token = crypto.randomBytes(24).toString('base64url');
      const updated = await tripRepository.update(tripId, userId, { shareToken: token });
      return updated;
    }

    // Return existing token
    return trip;
  },
};

module.exports = tripService;
