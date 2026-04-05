import apiClient from './client';

export const aiApi = {
  async generateTrip(params) {
    const { data } = await apiClient.post('/ai/generate-trip', params);
    return data; // { tripData }
  },
};
