import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default axiosClient;
