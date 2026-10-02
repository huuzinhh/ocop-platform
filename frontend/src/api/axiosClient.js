import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động gắn JWT Token nếu đã đăng nhập
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ocop_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Bóc tách data, xử lý lỗi 401
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ocop_token');
      localStorage.removeItem('ocop_user');
    }
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default axiosClient;
