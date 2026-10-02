import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Card, Row, Col, Tag, Typography, Rate, Button,
  Input, Select, Space, Spin, Alert, message, Avatar, Dropdown, Badge
} from 'antd';
import {
  ShopOutlined, EnvironmentOutlined, QrcodeOutlined,
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  SearchOutlined, SafetyCertificateOutlined, UserOutlined,
  LogoutOutlined, SettingOutlined, CrownOutlined, StarFilled
} from '@ant-design/icons';
import { ocopApi } from './api/ocopApi';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Hàm lấy màu tag tương ứng với vai trò
const getRoleBadge = (roles = []) => {
  if (roles.includes('ROLE_ADMIN')) return { label: 'Admin', color: 'red', icon: <CrownOutlined /> };
  if (roles.includes('ROLE_PRODUCER')) return { label: 'Nhà sản xuất', color: 'blue', icon: <ShopOutlined /> };
  return { label: 'Khách hàng', color: 'green', icon: <UserOutlined /> };
};

function App() {
  const { currentUser, isLoggedIn, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const checkSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await ocopApi.checkHealth();
      if (res && res.success) setHealthStatus(res.data);
    } catch (err) {
      setHealthStatus({ status: 'DOWN', error: err.message });
    } finally {
      setHealthLoading(false);
    }
  };

  const loadProducts = async (star, query) => {
    setProductsLoading(true);
    try {
      const params = {};
      if (star) params.starRating = star;
      if (query) params.search = query;
      const res = await ocopApi.getProducts(params);
      if (res && res.success) setProducts(res.data || []);
    } catch {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    loadProducts();
  }, []);

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất thành công');
  };

  // Menu dropdown khi đã đăng nhập
  const userMenuItems = currentUser ? [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 'bold' }}>{currentUser.fullName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{currentUser.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'profile', label: 'Thông tin tài khoản', icon: <UserOutlined /> },
    { key: 'swagger', label: 'Swagger API Docs', icon: <FileTextOutlined />,
      onClick: () => window.open('http://localhost:8080/swagger-ui.html', '_blank') },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true,
      onClick: handleLogout },
  ] : [];

  const roleBadge = currentUser ? getRoleBadge(currentUser.roles) : null;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* HEADER */}
      <Header style={{
        background: '#1b5e20', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: '#ffd54f' }} />
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
              OCOP VIỆT NAM
            </Title>
            <Text style={{ color: '#c8e6c9', fontSize: 11 }}>
              Sàn TMĐT & Truy xuất nguồn gốc đặc sản vùng miền
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['home']}
            style={{ background: 'transparent' }}
            items={[
              { key: 'home', icon: <ShopOutlined />, label: 'Sản phẩm OCOP' },
              { key: 'gis', icon: <EnvironmentOutlined />, label: 'Bản đồ GIS' },
              { key: 'trace', icon: <QrcodeOutlined />, label: 'Truy xuất QR' },
            ]}
          />

          {/* Khu vực người dùng */}
          {isLoggedIn ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px',
                background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                <Avatar size={32} style={{ background: '#ffd54f', color: '#1b5e20', fontWeight: 'bold' }}>
                  {currentUser.fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>
                    {currentUser.fullName}
                  </div>
                  <Tag color={roleBadge.color} icon={roleBadge.icon} style={{ fontSize: 10, margin: 0 }}>
                    {roleBadge.label}
                  </Tag>
                </div>
              </Space>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => setAuthModalOpen(true)}
              style={{ background: '#ffd54f', color: '#1b5e20', border: 'none',
                fontWeight: 'bold', borderRadius: 8 }}
            >
              Đăng nhập
            </Button>
          )}
        </div>
      </Header>

      {/* CONTENT */}
      <Content style={{ padding: '30px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {/* BANNER TRẠNG THÁI HỆ THỐNG */}
        <Card size="small" style={{ marginBottom: 24, borderRadius: 8,
          border: '1px solid #b7eb8f', background: '#f6ffed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12 }}>
            <Space size="middle">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <Text strong style={{ color: '#274916' }}>Trạng thái hệ thống (Tuần 2 — Auth & JWT):</Text>
                <div style={{ fontSize: 13, color: '#389e0d' }}>
                  {healthLoading ? <Spin size="small" /> :
                    healthStatus?.status === 'UP' ? (
                      <span>
                        Backend: <b>UP (Port 8080)</b> | DB: <b>{healthStatus.database}</b> |
                        Auth: <b>Spring Security 6 + JWT ✓</b> |
                        User: <b>{isLoggedIn ? `${currentUser.fullName} (${currentUser.roles?.join(', ')})` : 'Chưa đăng nhập'}</b>
                      </span>
                    ) : (
                      <span style={{ color: '#cf1322' }}>Backend DOWN — Chạy lại: cd backend && .\mvnw.cmd spring-boot:run</span>
                    )
                  }
                </div>
              </div>
            </Space>
            <Button size="small" icon={<SyncOutlined spin={healthLoading} />}
              onClick={checkSystemHealth}>Kiểm tra</Button>
          </div>
        </Card>

        {/* TIÊU ĐỀ & BỘ LỌC */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1b5e20' }}>
              Đặc Sản OCOP Vùng Miền
            </Title>
            <Text type="secondary">
              Sản phẩm đạt chứng nhận OCOP 3★ – 5★ từ các Hợp tác xã toàn quốc
            </Text>
          </div>
          <Space wrap size="middle">
            <Search placeholder="Tìm kiếm đặc sản OCOP..." allowClear
              onSearch={(v) => loadProducts(selectedStar, v)}
              style={{ width: 260 }} prefix={<SearchOutlined />} />
            <Select placeholder="Lọc theo sao OCOP" style={{ width: 170 }} allowClear
              onChange={(v) => { setSelectedStar(v); loadProducts(v, ''); }}>
              <Option value={5}><StarFilled style={{ color: '#faad14' }} /> 5 Sao Quốc gia</Option>
              <Option value={4}><StarFilled style={{ color: '#faad14' }} /> 4 Sao Tỉnh</Option>
              <Option value={3}><StarFilled style={{ color: '#faad14' }} /> 3 Sao Tỉnh</Option>
            </Select>
          </Space>
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" tip="Đang tải sản phẩm từ cơ sở dữ liệu..." />
          </div>
        ) : products.length === 0 ? (
          <Alert message="Không tìm thấy sản phẩm OCOP phù hợp." type="info" showIcon />
        ) : (
          <Row gutter={[20, 20]}>
            {products.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card hoverable
                  style={{ height: '100%', display: 'flex', flexDirection: 'column',
                    borderRadius: 10, overflow: 'hidden' }}
                  cover={
                    <div style={{ height: 200, overflow: 'hidden', position: 'relative', background: '#e8f5e9' }}>
                      <img alt={item.name} src={item.thumbnail}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://placehold.co/300x200?text=OCOP'; }} />
                      <Tag color={item.ocopStarRating === 5 ? 'gold' : 'blue'}
                        icon={<StarFilled />}
                        style={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }}>
                        OCOP {item.ocopStarRating}★
                      </Tag>
                    </div>
                  }
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', padding: 16 }}>
                  <div>
                    <Tag color="green" style={{ marginBottom: 6 }}>{item.category?.name}</Tag>
                    <Title level={5} ellipsis={{ rows: 2 }}
                      style={{ margin: '4px 0 8px', minHeight: 44 }}>{item.name}</Title>
                    <Rate disabled defaultValue={item.ocopStarRating} style={{ fontSize: 13 }} />
                    <Paragraph ellipsis={{ rows: 2 }} type="secondary"
                      style={{ fontSize: 13, marginTop: 8 }}>{item.description}</Paragraph>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 18, color: '#d32f2f' }}>
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>/{item.unit}</Text>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
                      <EnvironmentOutlined style={{ color: '#1b5e20', marginRight: 4 }} />
                      {item.producer?.location?.province || item.producer?.name}
                    </div>
                    <Space style={{ width: '100%' }}>
                      <Button type="primary" block
                        style={{ background: '#2e7d32', borderColor: '#2e7d32', borderRadius: 6 }}
                        onClick={() => { setSelectedProduct(item); setDetailModalVisible(true); }}>
                        Chi tiết
                      </Button>
                      {isLoggedIn ? (
                        <Button icon={<QrcodeOutlined />}
                          onClick={() => message.info('Tính năng giỏ hàng ở Tuần 3!')}
                          style={{ borderRadius: 6 }} />
                      ) : (
                        <Button icon={<UserOutlined />}
                          onClick={() => setAuthModalOpen(true)}
                          style={{ borderRadius: 6 }} title="Đăng nhập để mua hàng" />
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #e8e8e8', marginTop: 40 }}>
        <Text strong>ĐỒ ÁN TỐT NGHIỆP — CÔNG NGHỆ THÔNG TIN</Text><br />
        <Text type="secondary" style={{ fontSize: 13 }}>
          Nền tảng thương mại điện tử OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền
        </Text>
      </Footer>

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Layout>
  );
}

export default App;
