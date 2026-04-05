import apiClient from './client';

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
};
