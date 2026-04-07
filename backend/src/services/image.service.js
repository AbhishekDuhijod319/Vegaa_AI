const axios = require('axios');
const config = require('../config/env');
const { imageCache, getOrFetch } = require('../utils/cache');
const cloudinaryService = require('./cloudinary.service');
const logger = require('../utils/logger');

const PEXELS_BASE = 'https://api.pexels.com/v1';

const imageService = {
  /**
   * Search Pexels for images. Returns raw Pexels data (original URLs).
   * Used by SmartImage for general on-page imagery.
   */
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

  /**
   * Search Pexels and persist the best result to Cloudinary.
   * Returns a permanent Cloudinary URL instead of an ephemeral Pexels URL.
   * Used for trip cover photos and other images that need to persist.
   *
   * @param {string} query - Search query (e.g. destination name)
   * @param {string} [folder='destinations'] - Cloudinary subfolder
   * @returns {Promise<{secureUrl: string, publicId: string}|null>}
   */
  async searchAndPersist(query, folder = 'destinations') {
    if (!config.apis.pexels) {
      logger.warn('Pexels API key not configured.');
      return null;
    }

    // Build a deterministic cache key for the persisted image
    const sanitizedQuery = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    const cloudinaryCacheKey = `cloudinary:${folder}:${sanitizedQuery}`;

    // Check in-memory cache first (avoids re-uploading within 24h)
    const cached = imageCache.get(cloudinaryCacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Search Pexels for the best image
      const pexelsResult = await this.search(query, 1);
      const photo = pexelsResult.photos?.[0];
      if (!photo) return null;

      const pexelsUrl = photo.src.large2x || photo.src.large || photo.src.original;
      if (!pexelsUrl) return null;

      // Check if Cloudinary is configured
      if (!config.cloudinary.cloudName) {
        // Cloudinary not configured — return Pexels URL as fallback
        return { secureUrl: pexelsUrl, publicId: null };
      }

      // Upload to Cloudinary with deterministic public ID
      const result = await cloudinaryService.uploadFromUrl(
        pexelsUrl,
        folder,
        sanitizedQuery
      );

      const persisted = {
        secureUrl: result.secureUrl,
        publicId: result.publicId,
      };

      // Cache the mapping for 24h
      imageCache.set(cloudinaryCacheKey, persisted);

      logger.info(`Image persisted to Cloudinary: ${query} → ${result.publicId}`);
      return persisted;
    } catch (err) {
      logger.error(`searchAndPersist failed for "${query}":`, err.message);
      // Fallback: try to return raw Pexels URL
      try {
        const pexelsResult = await this.search(query, 1);
        const photo = pexelsResult.photos?.[0];
        const url = photo?.src?.large || photo?.src?.medium;
        return url ? { secureUrl: url, publicId: null } : null;
      } catch {
        return null;
      }
    }
  },
};

module.exports = imageService;
