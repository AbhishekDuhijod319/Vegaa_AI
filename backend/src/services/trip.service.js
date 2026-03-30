const tripRepository = require('../repositories/tripRepository');

const tripService = {
  async create({ userId, userEmail, userSelection, tripData, coverPhotoUrl, summary }) {
    const destination =
      userSelection?.destination?.label ||
      userSelection?.destination ||
      '';

    return tripRepository.create({
      userId,
      userEmail,
      destination,
      summary: summary || `Trip to ${destination}`,
      userSelection,
      tripData,
      coverPhotoUrl: coverPhotoUrl || '',
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
