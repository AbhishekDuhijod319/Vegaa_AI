const axios = require('axios');
const config = require('../config/env');
const { imageCache, getOrFetch } = require('../utils/cache');
const logger = require('../utils/logger');

const PEXELS_BASE = 'https://api.pexels.com/v1';

const imageService = {
  async search(query, perPage = 6) {
    if (!config.apis.pexels) {
      logger.warn('Pexels API key not configured.');
      return { photos: [], total_results: 0 };
    }

    const cacheKey = `pexels:${query.toLowerCase().trim()}:${perPage}`;

    return getOrFetch(imageCache, cacheKey, async () => {
      const resp = await axios.get(`${PEXELS_BASE}/search`, {
        headers: { Authorization: config.apis.pexels },
        params: {
          query,
          per_page: perPage,
          orientation: 'landscape',
        },
      });

      return {
        photos: resp.data.photos.map((p) => ({
          id: p.id,
          alt: p.alt || query,
          photographer: p.photographer,
          src: {
            original: p.src.original,
            large2x: p.src.large2x,
            large: p.src.large,
            medium: p.src.medium,
            small: p.src.small,
            tiny: p.src.tiny,
          },
        })),
        total_results: resp.data.total_results,
      };
    });
  },
};

module.exports = imageService;
