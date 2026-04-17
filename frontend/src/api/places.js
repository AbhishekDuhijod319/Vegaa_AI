import apiClient from './client';

// In-memory cache for resolved Google photo URLs
const photoUrlCache = new Map();

export const placesApi = {
  async suggestions(query) {
    const { data } = await apiClient.get('/places/suggestions', {
      params: { q: query },
    });
    return data; // { predictions }
  },

  async details(placeId) {
    const { data } = await apiClient.get('/places/details', {
      params: { place_id: placeId },
    });
    return data; // { result }
  },

  /**
   * Search for a place by text query (fallback for legacy searchPlaceRich).
   * Returns { data: { places: [...] } } to match the old GlobalAPI shape.
   */
  async search(query) {
    try {
      const { data } = await apiClient.get('/places/search', {
        params: { q: query },
      });
      return data; // { data: { places: [...] } }
    } catch {
      // Places search may fail if billing isn't enabled — return empty gracefully
      return { data: { places: [] } };
    }
  },

  /**
   * Resolve a Google Places photo reference to a direct CDN image URL.
   * Fetches once from the backend, caches the resolved URL in memory.
   *
   * @param {string} photoRef - photo_reference from a Places search result
   * @param {number} [maxWidth=600] - Max image width
   * @returns {Promise<string|null>} Direct Google CDN image URL
   */
  async getPhotoUrl(photoRef, maxWidth = 600) {
    if (!photoRef) return null;

    const cacheKey = `${photoRef}:${maxWidth}`;
    if (photoUrlCache.has(cacheKey)) return photoUrlCache.get(cacheKey);

    try {
      const { data } = await apiClient.get('/places/photo', {
        params: { ref: photoRef, maxwidth: maxWidth },
      });
      const url = data?.url || null;
      if (url) photoUrlCache.set(cacheKey, url);
      return url;
    } catch {
      return null;
    }
  },
};
