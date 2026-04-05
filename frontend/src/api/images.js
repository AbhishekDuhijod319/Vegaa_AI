import apiClient from './client';

export const imageApi = {
  async search(query, perPage = 6) {
    const { data } = await apiClient.get('/images/search', {
      params: { q: query, per_page: perPage },
    });
    return data; // { photos, total_results }
  },
};
