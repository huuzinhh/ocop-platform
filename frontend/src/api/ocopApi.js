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

  // Lấy danh sách sản phẩm của tôi (Nhà sản xuất / Quản trị viên)
  getMyProducts: () => {
    return axiosClient.get('/api/v1/products/my-products');
  },

  // Đăng bán sản phẩm OCOP mới
  createProduct: (productData) => {
    return axiosClient.post('/api/v1/products', productData);
  },

  // Cập nhật thông tin sản phẩm OCOP & giá/tồn kho/chứng nhận
  updateProduct: (id, productData) => {
    return axiosClient.put(`/api/v1/products/${id}`, productData);
  },

  // Xóa / Ngừng kinh doanh sản phẩm OCOP
  deleteProduct: (id) => {
    return axiosClient.delete(`/api/v1/products/${id}`);
  },
};
