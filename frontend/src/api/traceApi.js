import axiosClient from './axiosClient';

export const traceApi = {
  // Tra cứu nguồn gốc công khai qua mã lô (không cần đăng nhập)
  getTraceInfo: (batchCode) => {
    return axiosClient.get(`/api/v1/trace/${batchCode}`);
  },

  // Lấy danh sách lô sản xuất của cơ sở đăng nhập
  getBatches: () => {
    return axiosClient.get('/api/v1/batches');
  },

  // Tạo lô sản xuất mới (tự sinh mã QR & mã băm Blockchain)
  createBatch: (batchData) => {
    return axiosClient.post('/api/v1/batches', batchData);
  },

  // Lấy danh sách nhật ký hoạt động của 1 lô
  getBatchEvents: (batchId) => {
    return axiosClient.get(`/api/v1/batches/${batchId}/events`);
  },

  // Ghi nhật ký chuỗi cung ứng mới vào lô
  addEvent: (batchId, eventData) => {
    return axiosClient.post(`/api/v1/batches/${batchId}/events`, eventData);
  },
};
