const Trip = require('../models/Trip');

const tripRepository = {
  /**
   * Get full trip by ID (includes tripData blob).
   */
  async getById(tripId) {
    return Trip.findById(tripId);
  },

  /**
   * Get trip summaries for a user (excludes the large tripData blob).
   * Sorted by newest first. Used for "My Trips" and "Profile" pages.
   */
  async getListByUserId(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    return Trip.find({ userId })
      .select('-tripData') // Exclude large blob for list views
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  /**
   * Create a new trip with ownership tracking.
   */
  async create(data) {
    const trip = new Trip(data);
    await trip.save();
    return trip;
  },

  /**
   * Update a trip — enforces ownership via userId match.
   */
  async update(tripId, userId, updateData) {
    return Trip.findOneAndUpdate(
      { _id: tripId, userId }, // Ownership enforcement
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    );
  },

  /**
   * Delete a trip — enforces ownership.
   */
  async delete(tripId, userId) {
    return Trip.findOneAndDelete({ _id: tripId, userId });
  },

  /**
   * Count total trips for a user (for profile stats).
   */
  async countByUserId(userId) {
    return Trip.countDocuments({ userId });
  },

  /**
   * Get unique destinations for a user (for profile stats).
   */
  async getUniqueDestinations(userId) {
    const results = await Trip.distinct('destination', { userId });
    return results.filter(Boolean);
  },
};

module.exports = tripRepository;
