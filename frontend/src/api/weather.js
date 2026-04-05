import apiClient from './client';

export const weatherApi = {
  async getWeather(city) {
    const { data } = await apiClient.get('/weather', {
      params: { city },
    });
    return data; // { weather }
  },
};
