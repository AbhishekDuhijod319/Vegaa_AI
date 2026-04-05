const axios = require('axios');
const config = require('../config/env');
const { placesCache, getOrFetch } = require('../utils/cache');
const logger = require('../utils/logger');

const placesService = {
  /**
   * Search for place suggestions (autocomplete).
   */
  async suggestions(query) {
    if (!config.apis.googlePlaces) {
      logger.warn('Google Places API key not configured.');
      return [];
    }

    const cacheKey = `places:suggest:${query.toLowerCase().trim()}`;

    return getOrFetch(placesCache, cacheKey, async () => {
      const resp = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: query,
            types: '(cities)',
            key: config.apis.googlePlaces,
          },
        }
      );

      return (resp.data.predictions || []).map((p) => ({
        placeId: p.place_id,
        label: p.description,
        mainText: p.structured_formatting?.main_text || '',
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));
    });
  },

  /**
   * Get place details by place ID.
   */
  async getDetails(placeId) {
    if (!config.apis.googlePlaces) return null;

    const cacheKey = `places:detail:${placeId}`;

    return getOrFetch(placesCache, cacheKey, async () => {
      const resp = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'name,formatted_address,geometry,photos,rating,url',
            key: config.apis.googlePlaces,
          },
        }
      );

      const r = resp.data.result;
      return {
        name: r.name,
        address: r.formatted_address,
        lat: r.geometry?.location?.lat,
        lng: r.geometry?.location?.lng,
        rating: r.rating,
        url: r.url,
      };
    });
  },

  /**
   * Text search for places (replaces legacy searchPlaceRich).
   * Returns places with rating, address, location coordinates, etc.
   */
  async search(query) {
    if (!config.apis.googlePlaces) {
      logger.warn('Google Places API key not configured.');
      return { places: [] };
    }

    const cacheKey = `places:search:${query.toLowerCase().trim()}`;

    return getOrFetch(placesCache, cacheKey, async () => {
      const resp = await axios.get(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query,
            key: config.apis.googlePlaces,
          },
        }
      );

      const places = (resp.data.results || []).map((p) => ({
        displayName: { text: p.name },
        formattedAddress: p.formatted_address,
        location: {
          latitude: p.geometry?.location?.lat,
          longitude: p.geometry?.location?.lng,
        },
        rating: p.rating,
        userRatingCount: p.user_ratings_total,
        websiteUri: null, // Text search doesn't return website
      }));

      return { places };
    });
  },
};

module.exports = placesService;
