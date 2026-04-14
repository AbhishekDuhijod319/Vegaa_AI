const tripService = require('../services/trip.service');

const tripController = {
  async create(req, res) {
    const trip = await tripService.create({
      userId: req.user.userId,
      userEmail: req.user.email,
      ...req.body,
    });
    res.status(201).json({ trip });
  },

  async list(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const trips = await tripService.listByUser(req.user.userId, { page, limit });
    res.json({ trips, page, limit });
  },

  async getById(req, res) {
    const trip = await tripService.getById(req.params.id);

    // Ownership check: owner can always view
    const isOwner = trip.userId?.toString() === req.user.userId;

    // Non-owners need a valid share token
    if (!isOwner) {
      const providedToken = req.query.share || req.query.token;
      if (!trip.shareToken || !providedToken || providedToken !== trip.shareToken) {
        return res.status(403).json({ error: 'You do not have access to this trip. Ask the owner for a share link.' });
      }
    }

    res.json({ trip });
  },

  async update(req, res) {
    const trip = await tripService.update(req.params.id, req.user.userId, req.body);
    res.json({ trip });
  },

  async delete(req, res) {
    await tripService.delete(req.params.id, req.user.userId);
    res.json({ message: 'Trip deleted successfully.' });
  },

  async stats(req, res) {
    const stats = await tripService.getStats(req.user.userId);
    res.json({ stats });
  },

  /**
   * POST /:id/share — Generate a share token for a trip (owner only)
   */
  async generateShareToken(req, res) {
    const trip = await tripService.generateShareToken(req.params.id, req.user.userId);
    const shareUrl = `/view-trip/${trip._id}?share=${trip.shareToken}`;
    res.json({
      message: 'Share link generated.',
      shareToken: trip.shareToken,
      shareUrl,
    });
  },
};

module.exports = tripController;
