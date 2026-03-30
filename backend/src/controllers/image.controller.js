const imageService = require('../services/image.service');

const imageController = {
  async search(req, res) {
    const query = req.query.q;
    const perPage = parseInt(req.query.per_page, 10) || 6;

    if (!query) return res.status(400).json({ error: 'Query parameter "q" is required.' });

    const result = await imageService.search(query, perPage);
    res.json(result);
  },
};

module.exports = imageController;
