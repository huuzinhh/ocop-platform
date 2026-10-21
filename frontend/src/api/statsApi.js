import axiosClient from './axiosClient';

export const statsApi = {
  // Lấy dữ liệu Dashboard thống kê doanh thu và hiệu quả bán hàng
  getDashboardStats: (producerId = null) => {
    const params = {};
    if (producerId) params.producerId = producerId;
    return axiosClient.get('/api/v1/stats/dashboard', { params });
  },
};
