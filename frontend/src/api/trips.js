import apiClient from './client';

export const tripApi = {
  async create(tripPayload) {
    const { data } = await apiClient.post('/trips', tripPayload);
    return data; // { trip }
  },

  async list({ page = 1, limit = 20 } = {}) {
    const { data } = await apiClient.get('/trips', { params: { page, limit } });
    return data; // { trips, page, limit }
  },

  async getById(tripId) {
    const { data } = await apiClient.get(`/trips/${tripId}`);
    return data; // { trip }
  },

  async update(tripId, updateData) {
    const { data } = await apiClient.put(`/trips/${tripId}`, updateData);
    return data; // { trip }
  },

  async delete(tripId) {
    const { data } = await apiClient.delete(`/trips/${tripId}`);
    return data; // { message }
  },

  async getStats() {
    const { data } = await apiClient.get('/trips/stats');
    return data; // { stats }
  },
};
