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

  /**
   * Resolve a Google Places photo reference to a direct image URL.
   * Returns the resolved Google CDN URL as JSON for the frontend to use directly.
   */
  async photo(req, res) {
    const photoRef = req.query.ref;
    const maxWidth = Math.min(parseInt(req.query.maxwidth, 10) || 600, 1600);

    if (!photoRef) {
      return res.status(400).json({ error: 'Query parameter "ref" is required.' });
    }

    const url = await placesService.getPhoto(photoRef, maxWidth);
    if (!url) {
      return res.status(404).json({ error: 'Photo not found or unavailable.' });
    }

    // Return as JSON — frontend will use this URL directly as img src
    res.json({ url });
  },
};

module.exports = placesController;
