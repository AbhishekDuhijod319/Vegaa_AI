const placesService = require('../services/places.service');

const placesController = {
  async suggestions(req, res) {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required.' });
    const results = await placesService.suggestions(query);
    res.json({ predictions: results });
  },

  async details(req, res) {
    const placeId = req.query.place_id;
    if (!placeId) return res.status(400).json({ error: 'Query parameter "place_id" is required.' });
    const result = await placesService.getDetails(placeId);
    res.json({ result });
  },

  async search(req, res) {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required.' });
    const result = await placesService.search(query);
    res.json({ data: result });
  },
};

module.exports = placesController;
