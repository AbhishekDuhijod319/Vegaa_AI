const aiService = require('../services/ai.service');

const aiController = {
  async generateTrip(req, res) {
    const tripData = await aiService.generateTrip(req.body);
    res.json({ tripData });
  },
};

module.exports = aiController;
