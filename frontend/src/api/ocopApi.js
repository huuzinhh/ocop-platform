import axiosClient from './axiosClient';

export const ocopApi = {
  // Kiểm tra trạng thái hệ thống
  checkHealth: () => {
    return axiosClient.get('/api/health');
  },

  // Lấy danh sách sản phẩm OCOP
  getProducts: (params = {}) => {
    return axiosClient.get('/api/v1/products', { params });
  },

  // Lấy chi tiết sản phẩm
  getProductById: (id) => {
    return axiosClient.get(`/api/v1/products/${id}`);
  },

  // Lấy danh mục OCOP
  getCategories: () => {
    return axiosClient.get('/api/v1/categories');
  },
};
