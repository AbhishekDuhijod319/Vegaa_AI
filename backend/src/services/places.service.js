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
   * Returns places with rating, address, location coordinates, photo_reference, etc.
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
        photoRef: p.photos?.[0]?.photo_reference || null,
        websiteUri: null, // Text search doesn't return website
      }));

      return { places };
    });
  },

  /**
   * Resolve a Google Places photo reference to a direct image URL.
   * Google Places Photo API returns a 302 redirect — we follow it and cache the final URL.
   *
   * @param {string} photoRef - The photo_reference from a Places search result
   * @param {number} [maxWidth=400] - Max image width in pixels (controls quality + cost)
   * @returns {Promise<string|null>} The resolved image URL, or null on failure
   */
  async getPhoto(photoRef, maxWidth = 400) {
    if (!config.apis.googlePlaces || !photoRef) return null;

    const cacheKey = `places:photo:${photoRef}:${maxWidth}`;
    const cached = placesCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Follow the redirect to get the actual image URL
      const resp = await axios.get(
        'https://maps.googleapis.com/maps/api/place/photo',
        {
          params: {
            photoreference: photoRef,
            maxwidth: maxWidth,
            key: config.apis.googlePlaces,
          },
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
        }
      );

      // If we get a redirect (302), the Location header has the actual image URL
      const imageUrl = resp.headers?.location || resp.request?.res?.responseUrl || null;
      if (imageUrl) {
        placesCache.set(cacheKey, imageUrl);
        return imageUrl;
      }

      return null;
    } catch (err) {
      // Axios throws on 3xx when maxRedirects=0, extract Location from the error response
      if (err.response?.status === 302 && err.response?.headers?.location) {
        const imageUrl = err.response.headers.location;
        placesCache.set(cacheKey, imageUrl);
        return imageUrl;
      }
      logger.error(`Places photo fetch failed for ref "${photoRef.slice(0, 20)}...":`, err.message);
      return null;
    }
  },
};

module.exports = placesService;
