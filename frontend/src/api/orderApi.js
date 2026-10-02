import axiosClient from './axiosClient';

export const orderApi = {
  createOrder: (orderData) => axiosClient.post('/api/v1/orders', orderData),
  getMyOrders: () => axiosClient.get('/api/v1/orders'),
  getAllOrders: () => axiosClient.get('/api/v1/orders/all'),
  getOrderByCode: (orderCode) => axiosClient.get(`/api/v1/orders/${orderCode}`),
  mockPay: (orderCode, paymentMethod = 'MOCK_VNPAY') =>
    axiosClient.post(`/api/v1/orders/${orderCode}/mock-pay`, { paymentMethod }),
  updateStatus: (orderCode, status) =>
    axiosClient.put(`/api/v1/orders/${orderCode}/status`, { status }),
  createProduct: (productData) => axiosClient.post('/api/v1/products', productData),
};
