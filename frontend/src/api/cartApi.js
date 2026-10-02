import axiosClient from './axiosClient';

export const cartApi = {
  getCart: () => axiosClient.get('/api/v1/cart'),
  addToCart: (productId, quantity = 1) => axiosClient.post('/api/v1/cart/items', { productId, quantity }),
  updateQuantity: (itemId, quantity) => axiosClient.put(`/api/v1/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => axiosClient.delete(`/api/v1/cart/items/${itemId}`),
  clearCart: () => axiosClient.delete('/api/v1/cart'),
};
