import axiosClient from './axiosClient';

export const adminApi = {
  // ==========================================
  // 1. THẨM ĐỊNH CHỨNG NHẬN OCOP (Ưu tiên 1)
  // ==========================================
  getCertificates: (status) => {
    const params = status && status !== 'ALL' ? { status } : {};
    return axiosClient.get('/api/v1/admin/certificates', { params });
  },

  getCertificateStats: () => {
    return axiosClient.get('/api/v1/admin/certificates/stats');
  },

  auditCertificate: (id, action, rejectionReason) => {
    return axiosClient.put(`/api/v1/admin/certificates/${id}/audit`, {
      action,
      rejectionReason: rejectionReason || null,
    });
  },

  // ==========================================
  // 2. QUẢN LÝ NGƯỜI DÙNG & HTX (Ưu tiên 2)
  // ==========================================
  getUsers: (params = {}) => {
    return axiosClient.get('/api/v1/admin/users', { params });
  },

  getUserStats: () => {
    return axiosClient.get('/api/v1/admin/users/stats');
  },

  updateUserStatus: (userId, status) => {
    return axiosClient.put(`/api/v1/admin/users/${userId}/status`, { status });
  },

  verifyProducer: (producerId, isVerified) => {
    return axiosClient.put(`/api/v1/admin/users/producers/${producerId}/verify`, { isVerified });
  },

  // ==========================================
  // 3. QUẢN LÝ DANH MỤC OCOP (Ưu tiên 3)
  // ==========================================
  getCategories: () => {
    return axiosClient.get('/api/v1/categories');
  },

  createCategory: (data) => {
    return axiosClient.post('/api/v1/categories', data);
  },

  updateCategory: (id, data) => {
    return axiosClient.put(`/api/v1/categories/${id}`, data);
  },

  deleteCategory: (id) => {
    return axiosClient.delete(`/api/v1/categories/${id}`);
  },
};

export default adminApi;
