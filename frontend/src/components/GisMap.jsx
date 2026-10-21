import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Row, Col, Input, Select, Button, Space, Typography, Tag,
  Badge, Spin, Empty, Drawer, Image, Tooltip, message, Modal, Form, InputNumber, Alert
} from 'antd';
import {
  EnvironmentOutlined, SearchOutlined, StarFilled, ShopOutlined,
  PhoneOutlined, MailOutlined, GlobalOutlined, CheckCircleOutlined,
  CompassOutlined, FilterOutlined, ReloadOutlined, ShoppingCartOutlined,
  EyeOutlined, AimOutlined, FormOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gisApi } from '../api/gisApi';
import { ocopApi } from '../api/ocopApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Tạo Custom HTML DivIcon theo số sao OCOP
const createCustomMarkerIcon = (starRating = 4, isSelected = false) => {
  const is5Star = starRating === 5;
  const bgColor = is5Star ? '#fa8c16' : '#2e7d32';
  const borderColor = is5Star ? '#ffd54f' : '#a5d6a7';
  const pulseClass = isSelected ? 'ocop-marker-selected' : '';

  const html = `
    <div class="ocop-gis-marker ${pulseClass}" style="
      background: ${bgColor};
      color: #fff;
      border: 3px solid ${borderColor};
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      cursor: pointer;
      font-weight: bold;
      transition: transform 0.2s ease;
    ">
      <span style="font-size: 14px; line-height: 1;">★</span>
      <span style="font-size: 10px; line-height: 1; font-weight: 800;">${starRating}★</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'ocop-marker-wrapper',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

const GisMap = ({ onSelectProduct }) => {
  const { currentUser, isProducer, isAdmin, isLoggedIn } = useAuth();
  const { addToCart } = useCart();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Data states
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Selected producer / drawer state
  const [selectedProducer, setSelectedProducer] = useState(null);
  const [productsDrawerOpen, setProductsDrawerOpen] = useState(false);

  // Update Location Modal State (for Producer/Admin)
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateForm] = Form.useForm();
  const [pickedLatLng, setPickedLatLng] = useState(null);

  // 1. Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Trung tâm Việt Nam (Đà Nẵng: 16.047, 108.206), zoom 6
      const map = L.map(mapContainerRef.current, {
        center: [16.047079, 108.20623],
        zoom: 6,
        minZoom: 5,
        maxZoom: 18,
      });

      // Lớp bản đồ nền OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OCOP Việt Nam GIS',
        maxZoom: 19,
      }).addTo(map);

      // Lớp chứa các Marker OCOP
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Lắng nghe sự kiện click trên bản đồ để hỗ trợ chọn toạ độ
      map.on('click', (e) => {
        setPickedLatLng(e.latlng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // 2. Tải danh mục và danh sách tỉnh thành
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, catRes] = await Promise.all([
          gisApi.getProvinces(),
          ocopApi.getCategories(),
        ]);
        if (provRes && provRes.success) setProvinces(provRes.data || []);
        if (catRes && catRes.success) setCategories(catRes.data || []);
      } catch (err) {
        console.error('Lỗi tải danh mục GIS:', err);
      }
    };
    fetchMetadata();
  }, []);

  // 3. Tải danh sách điểm định vị GIS
  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProvince) params.province = selectedProvince;
      if (selectedStar) params.starRating = selectedStar;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (searchText && searchText.trim()) params.search = searchText.trim();

      const res = await gisApi.getMarkers(params);
      if (res && res.success) {
        setMarkers(res.data || []);
      }
    } catch (err) {
      message.error('Không thể tải dữ liệu bản đồ số GIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkers();
  }, [selectedProvince, selectedStar, selectedCategory]);

  // 4. Vẽ Marker lên bản đồ khi danh sách `markers` thay đổi
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (markers.length === 0) return;

    const bounds = L.latLngBounds();

    markers.forEach((m) => {
      if (!m.latitude || !m.longitude) return;

      const lat = Number(m.latitude);
      const lng = Number(m.longitude);
      bounds.extend([lat, lng]);

      const isSelected = selectedProducer && selectedProducer.producerId === m.producerId;
      const icon = createCustomMarkerIcon(m.maxStarRating || 4, isSelected);
      const marker = L.marker([lat, lng], { icon });

      // Nội dung Popup HTML
      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '240px';
      popupContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      popupContent.innerHTML = `
        <div style="border-bottom: 2px solid #2e7d32; padding-bottom: 6px; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 14px; color: #1b5e20;">
            ${m.producerName}
            ${m.isVerified ? '<span style="color: #52c41a; font-size: 12px; margin-left: 4px;" title="HTX Đã Xác Thực">✓</span>' : ''}
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">
            📍 ${m.district ? `${m.district}, ` : ''}${m.province || 'Việt Nam'}
          </div>
        </div>
        <div style="font-size: 12px; margin-bottom: 8px; line-height: 1.4; color: #444;">
          ${m.description ? m.description.slice(0, 100) + '...' : 'Cơ sở sản xuất đặc sản OCOP địa phương'}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="background: ${m.maxStarRating === 5 ? '#faad14' : '#52c41a'}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">
            ★ Chuẩn OCOP ${m.maxStarRating} Sao
          </span>
          <span style="font-size: 11px; color: #1b5e20; font-weight: bold;">
            ${m.totalProducts} sản phẩm
          </span>
        </div>
      `;

      // Nút xem chi tiết sản phẩm trên Popup
      const viewBtn = document.createElement('button');
      viewBtn.innerText = 'Xem các sản phẩm OCOP →';
      viewBtn.style.cssText = `
        width: 100%;
        padding: 6px 12px;
        background: #1b5e20;
        color: #fff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
      `;
      viewBtn.onmouseover = () => { viewBtn.style.background = '#2e7d32'; };
      viewBtn.onmouseout = () => { viewBtn.style.background = '#1b5e20'; };
      viewBtn.onclick = () => {
        setSelectedProducer(m);
        setProductsDrawerOpen(true);
      };

      popupContent.appendChild(viewBtn);

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedProducer(m);
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Tự động căn chỉnh góc nhìn bản đồ vừa vặn với các Marker (nếu có)
    if (markers.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [markers]);

  // Bay tới vị trí một cơ sở khi click vào danh sách bên cạnh
  const handleFlyToProducer = (p) => {
    setSelectedProducer(p);
    if (mapInstanceRef.current && p.latitude && p.longitude) {
      mapInstanceRef.current.flyTo([Number(p.latitude), Number(p.longitude)], 12, {
        duration: 1.2,
      });
    }
  };

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedProvince(null);
    setSelectedStar(null);
    setSelectedCategory(null);
    setSearchText('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([16.047079, 108.20623], 6);
    }
  };

  // Mở modal cập nhật tọa độ GPS
  const handleOpenUpdateModal = (producer) => {
    const target = producer || selectedProducer;
    if (!target) return;
    updateForm.resetFields();
    updateForm.setFieldsValue({
      producerId: target.producerId,
      producerName: target.producerName,
      province: target.province || 'Hà Nội',
      district: target.district || '',
      ward: target.ward || '',
      addressDetail: target.addressDetail || '',
      latitude: target.latitude ? Number(target.latitude) : 21.0313,
      longitude: target.longitude ? Number(target.longitude) : 105.7825,
    });
    setUpdateModalOpen(true);
  };

  // Lưu tọa độ GPS
  const handleSaveLocation = async (values) => {
    setUpdateSubmitting(true);
    try {
      const payload = {
        province: values.province,
        district: values.district,
        ward: values.ward,
        addressDetail: values.addressDetail,
        latitude: values.latitude,
        longitude: values.longitude,
      };
      const res = await gisApi.updateLocation(values.producerId, payload);
      if (res && res.success) {
        message.success('Cập nhật tọa độ GIS cơ sở OCOP thành công!');
        setUpdateModalOpen(false);
        fetchMarkers();
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Lỗi cập nhật tọa độ');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  // Khi click trên bản đồ và đang mở modal thì tự điền toạ độ
  useEffect(() => {
    if (pickedLatLng && updateModalOpen) {
      updateForm.setFieldsValue({
        latitude: Number(pickedLatLng.lat.toFixed(6)),
        longitude: Number(pickedLatLng.lng.toFixed(6)),
      });
      message.info(`Đã lấy tọa độ từ bản đồ: ${pickedLatLng.lat.toFixed(4)}, ${pickedLatLng.lng.toFixed(4)}`);
    }
  }, [pickedLatLng]);

  return (
    <div style={{ position: 'relative' }}>
      {/* THANH CÔNG CỤ BỘ LỌC GIS */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #c8e6c9',
          background: '#f1f8e9',
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Search
              placeholder="Tìm theo tên HTX, đặc sản..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={fetchMarkers}
              allowClear
              enterButton={<SearchOutlined />}
            />
          </Col>

          <Col xs={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn Tỉnh / Thành"
              value={selectedProvince}
              onChange={setSelectedProvince}
              allowClear
              showSearch
            >
              <Option value={null}>Tất cả Tỉnh/Thành</Option>
              {provinces.map((p) => (
                <Option key={p} value={p}>📍 {p}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Hạng sao OCOP"
              value={selectedStar}
              onChange={setSelectedStar}
              allowClear
            >
              <Option value={null}>Tất cả số sao</Option>
              <Option value={5}>⭐⭐⭐⭐⭐ (5 Sao)</Option>
              <Option value={4}>⭐⭐⭐⭐ (4 Sao)</Option>
              <Option value={3}>⭐⭐⭐ (3 Sao)</Option>
            </Select>
          </Col>

          <Col xs={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Ngành hàng OCOP"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
            >
              <Option value={null}>Tất cả ngành hàng</Option>
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} md={4} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                Đặt lại
              </Button>
              <Button type="primary" style={{ background: '#1b5e20' }} icon={<FilterOutlined />} onClick={fetchMarkers}>
                Lọc ({markers.length})
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* KHU VỰC BẢN ĐỒ & SIDEBAR DANH SÁCH */}
      <Row gutter={[16, 16]}>
        {/* CỘT BẢN ĐỒ LEAFLET */}
        <Col xs={24} lg={16}>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #d9d9d9',
              position: 'relative',
            }}
          >
            {/* Vùng chứa Map */}
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '620px',
                zIndex: 1,
              }}
            />

            {/* Overlay Loading */}
            {loading && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.65)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }}>
                <Spin size="large" tip="Đang tải dữ liệu định vị OCOP..." />
              </div>
            )}

            {/* Chú giải bản đồ (Legend) góc dưới */}
            <div style={{
              position: 'absolute', bottom: 16, left: 16, zIndex: 900,
              background: 'rgba(255,255,255,0.95)', padding: '8px 14px',
              borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: 12, border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1b5e20' }}>
                🌾 Chú thích Bản đồ OCOP:
              </div>
              <Space direction="vertical" size={2}>
                <div><span style={{ color: '#fa8c16', fontWeight: 'bold' }}>● Vàng</span>: OCOP 5 Sao (Cấp Quốc gia)</div>
                <div><span style={{ color: '#2e7d32', fontWeight: 'bold' }}>● Xanh lá</span>: OCOP 4 Sao (Cấp Tỉnh)</div>
                <div><span style={{ color: '#1890ff', fontWeight: 'bold' }}>● Xanh dương</span>: OCOP 3 Sao (Cấp Huyện)</div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* CỘT SIDEBAR DANH SÁCH CƠ SỞ OCOP */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <EnvironmentOutlined style={{ color: '#1b5e20' }} />
                  <span style={{ color: '#1b5e20', fontWeight: 'bold' }}>
                    Điểm Đến OCOP ({markers.length})
                  </span>
                </Space>
                {markers.length > 0 && (
                  <Tag color="green">
                    {Array.from(new Set(markers.map(m => m.province).filter(Boolean))).length} Tỉnh/Thành
                  </Tag>
                )}
              </div>
            }
            bodyStyle={{ padding: 12, height: '560px', overflowY: 'auto' }}
            style={{
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              border: '1px solid #d9d9d9',
            }}
          >
            {markers.length === 0 ? (
              <Empty
                description="Không tìm thấy cơ sở OCOP phù hợp với bộ lọc"
                style={{ marginTop: 80 }}
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {markers.map((m) => {
                  const isSelected = selectedProducer && selectedProducer.producerId === m.producerId;
                  return (
                    <Card
                      key={m.producerId}
                      size="small"
                      hoverable
                      onClick={() => handleFlyToProducer(m)}
                      style={{
                        borderRadius: 8,
                        borderColor: isSelected ? '#52c41a' : '#e8e8e8',
                        background: isSelected ? '#f6ffed' : '#fff',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1b5e20' }}>
                            {m.producerName}
                            {m.isVerified && (
                              <Tooltip title="Cơ sở đã được thẩm định pháp lý OCOP">
                                <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 6 }} />
                              </Tooltip>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                            📍 {m.district ? `${m.district}, ` : ''}<b>{m.province}</b>
                          </div>
                        </div>

                        <Tag color={m.maxStarRating === 5 ? 'gold' : 'green'} style={{ fontWeight: 'bold', margin: 0 }}>
                          ★ {m.maxStarRating} Sao
                        </Tag>
                      </div>

                      {m.description && (
                        <div style={{ fontSize: 11, color: '#555', marginTop: 6, lineHeight: 1.3 }}>
                          {m.description.slice(0, 80)}...
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px dashed #eee', paddingTop: 6 }}>
                        <Text style={{ fontSize: 11, color: '#2e7d32', fontWeight: 600 }}>
                          📦 {m.totalProducts} Sản phẩm OCOP
                        </Text>
                        <Space size={6}>
                          {(isAdmin() || (isProducer() && currentUser?.id === m.producerId)) && (
                            <Tooltip title="Cập nhật tọa độ GPS cơ sở">
                              <Button
                                size="small"
                                icon={<AimOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenUpdateModal(m);
                                }}
                              />
                            </Tooltip>
                          )}
                          <Button
                            size="small"
                            type="primary"
                            style={{ background: '#1b5e20', fontSize: 11 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProducer(m);
                              setProductsDrawerOpen(true);
                            }}
                          >
                            Xem sản phẩm
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* DRAWER DANH SÁCH SẢN PHẨM CỦA CƠ SỞ CHỌN TỪ BẢN ĐỒ */}
      <Drawer
        open={productsDrawerOpen}
        onClose={() => setProductsDrawerOpen(false)}
        width={540}
        title={
          selectedProducer ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShopOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
                  {selectedProducer.producerName}
                </Title>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                📍 {selectedProducer.addressDetail || `${selectedProducer.district || ''}, ${selectedProducer.province}`}
              </Text>
            </div>
          ) : 'Sản phẩm OCOP'
        }
      >
        {selectedProducer && (
          <div>
            {/* THÔNG TIN LIÊN HỆ CƠ SỞ */}
            <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Space direction="vertical" size={4} style={{ width: '100%', fontSize: 12 }}>
                {selectedProducer.phone && (
                  <div><PhoneOutlined style={{ color: '#1b5e20', marginRight: 6 }} /> Hotline: <b>{selectedProducer.phone}</b></div>
                )}
                {selectedProducer.contactEmail && (
                  <div><MailOutlined style={{ color: '#1b5e20', marginRight: 6 }} /> Email: {selectedProducer.contactEmail}</div>
                )}
                <div>
                  <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                  Trạng thái bảo chứng: <b>{selectedProducer.isVerified ? '✓ Đã thẩm định đạt chuẩn HTX OCOP' : 'Đang cập nhật'}</b>
                </div>
              </Space>
            </Card>

            <Title level={5} style={{ color: '#1b5e20', marginBottom: 12 }}>
              Danh Mục Đặc Sản OCOP ({selectedProducer.products?.length || 0})
            </Title>

            {(!selectedProducer.products || selectedProducer.products.length === 0) ? (
              <Empty description="Cơ sở đang cập nhật danh mục sản phẩm" />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {selectedProducer.products.map((item) => (
                  <Card
                    key={item.id}
                    size="small"
                    style={{ borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
                  >
                    <Row gutter={12} align="middle">
                      <Col span={6}>
                        <Image
                          src={item.thumbnail}
                          alt={item.name}
                          width="100%"
                          height={75}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                          fallback="https://placehold.co/100x100?text=OCOP"
                        />
                      </Col>
                      <Col span={18}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text strong style={{ fontSize: 13, color: '#1b5e20' }}>
                            {item.name}
                          </Text>
                          <Tag color={item.ocopStarRating === 5 ? 'gold' : 'green'} style={{ fontWeight: 'bold' }}>
                            ★ {item.ocopStarRating} Sao
                          </Tag>
                        </div>

                        <div style={{ marginTop: 2, fontSize: 11, color: '#888' }}>
                          Ngành: <Tag color="blue" style={{ fontSize: 10 }}>{item.categoryName || 'Đặc sản'}</Tag>
                          {item.certificateCode && (
                            <span> | Mã OCOP: <b>{item.certificateCode}</b></span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <Text strong style={{ fontSize: 15, color: '#d32f2f' }}>
                            {Number(item.price || 0).toLocaleString('vi-VN')} đ
                            <span style={{ fontSize: 11, color: '#888', fontWeight: 'normal' }}> / {item.unit || 'Hộp'}</span>
                          </Text>

                          <Space>
                            {onSelectProduct && (
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                  onSelectProduct(item);
                                  setProductsDrawerOpen(false);
                                }}
                              >
                                Xem
                              </Button>
                            )}
                            <Button
                              size="small"
                              type="primary"
                              icon={<ShoppingCartOutlined />}
                              style={{ background: '#ffd54f', color: '#1b5e20', borderColor: '#ffd54f', fontWeight: 'bold' }}
                              onClick={() => {
                                if (!isLoggedIn) {
                                  message.info('Vui lòng đăng nhập để mua đặc sản OCOP');
                                  return;
                                }
                                addToCart(item.id, 1);
                              }}
                            >
                              Mua ngay
                            </Button>
                          </Space>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            )}
          </div>
        )}
      </Drawer>

      {/* MODAL CẬP NHẬT TỌA ĐỘ GPS CHO NHÀ SẢN XUẤT / ADMIN */}
      <Modal
        open={updateModalOpen}
        onCancel={() => setUpdateModalOpen(false)}
        title={
          <Space>
            <AimOutlined style={{ color: '#1b5e20' }} />
            <span>Cập Nhật Tọa Độ Định Vị GPS Vùng Sản Xuất OCOP</span>
          </Space>
        }
        footer={null}
        width={560}
      >
        <Alert
          message="Hướng dẫn ghim vị trí:"
          description="Bạn có thể click trực tiếp lên bất kỳ điểm nào trên Bản đồ GIS để hệ thống tự động điền Tọa độ (Vĩ độ / Kinh độ), hoặc nhập thủ công bên dưới."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={updateForm}
          layout="vertical"
          onFinish={handleSaveLocation}
        >
          <Form.Item name="producerId" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Cơ sở sản xuất" name="producerName">
            <Input disabled style={{ fontWeight: 'bold' }} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Tỉnh / Thành phố"
                name="province"
                rules={[{ required: true, message: 'Vui lòng nhập Tỉnh/Thành' }]}
              >
                <Input placeholder="Ví dụ: Bến Tre, Hà Giang, Lâm Đồng..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quận / Huyện" name="district">
                <Input placeholder="Ví dụ: Huyện Mèo Vạc, TP Đà Lạt..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Địa chỉ chi tiết (Vùng trồng / Xưởng chế biến)" name="addressDetail">
            <Input placeholder="Ví dụ: Làng văn hóa du lịch Pả Vi, Xã Pả Vi..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Vĩ độ (Latitude)"
                name="latitude"
                rules={[{ required: true, message: 'Nhập vĩ độ' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="Ví dụ: 23.1633" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kinh độ (Longitude)"
                name="longitude"
                rules={[{ required: true, message: 'Nhập kinh độ' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.0001} placeholder="Ví dụ: 105.4116" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateSubmitting}
                style={{ background: '#1b5e20', borderColor: '#1b5e20', fontWeight: 'bold' }}
              >
                Lưu Tọa Độ Lên Bản Đồ
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GisMap;
