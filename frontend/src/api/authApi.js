import axiosClient from './axiosClient';

export const authApi = {
  login: (data) => axiosClient.post('/api/v1/auth/login', data),
  register: (data) => axiosClient.post('/api/v1/auth/register', data),
  getMe: () => axiosClient.get('/api/v1/auth/me'),
};
