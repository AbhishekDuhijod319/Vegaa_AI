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
};

module.exports = tripController;
