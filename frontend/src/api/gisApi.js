import axiosClient from './axiosClient';

export const gisApi = {
  // Lấy danh sách điểm định vị GIS các cơ sở OCOP (kèm bộ lọc)
  getMarkers: (params = {}) => {
    return axiosClient.get('/api/v1/gis/markers', { params });
  },

  // Lấy danh sách các tỉnh thành có cơ sở OCOP
  getProvinces: () => {
    return axiosClient.get('/api/v1/gis/provinces');
  },

  // Cập nhật tọa độ GPS và địa chỉ cơ sở
  updateLocation: (producerId, data) => {
    return axiosClient.put(`/api/v1/gis/producers/${producerId}/location`, data);
  },
};

export default gisApi;
