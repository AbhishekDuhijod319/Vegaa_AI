import apiClient from './client';

export const authApi = {
  async register({ name, email, password }) {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    return data; // { accessToken, user }
  },

  async login({ email, password }) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data; // { accessToken, user }
  },

  async googleLogin({ accessToken }) {
    const { data } = await apiClient.post('/auth/google', { accessToken });
    return data; // { accessToken, user }
  },

  async refresh() {
    const { data } = await apiClient.post('/auth/refresh');
    return data; // { accessToken, user }
  },

  async logout() {
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  async getProfile() {
    const { data } = await apiClient.get('/auth/me');
    return data; // { user }
  },

  async updateProfile({ name, email }) {
    const { data } = await apiClient.put('/users/profile', { name, email });
    return data; // { message, user }
  },

  async scheduleDeletion() {
    const { data } = await apiClient.post('/users/schedule-deletion');
    return data; // { message, deletionScheduledAt }
  },

  async cancelDeletion() {
    const { data } = await apiClient.post('/users/cancel-deletion');
    return data; // { message }
  },
};
