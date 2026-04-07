import apiClient from './client';

export const imageApi = {
  async search(query, perPage = 6) {
    const { data } = await apiClient.get('/images/search', {
      params: { q: query, per_page: perPage },
    });
    return data; // { photos, total_results }
  },

  /**
   * Upload an avatar image file.
   * @param {File} file - The image file to upload
   * @returns {Promise<{message: string, picture: string}>}
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data; // { message, picture }
  },
};
