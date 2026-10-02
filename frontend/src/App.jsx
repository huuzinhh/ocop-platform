import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Card, Row, Col, Tag, Typography, Rate, Button,
  Input, Select, Space, Spin, Alert, message, Avatar, Dropdown, Badge,
  Modal, Divider, Popconfirm, Empty
} from 'antd';
import {
  ShopOutlined, EnvironmentOutlined, QrcodeOutlined,
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  SearchOutlined, SafetyCertificateOutlined, UserOutlined,
  LogoutOutlined, CrownOutlined, StarFilled, ShoppingCartOutlined,
  PlusCircleOutlined, HistoryOutlined, DeleteOutlined,
  OrderedListOutlined, CompassOutlined, AuditOutlined
} from '@ant-design/icons';
import { ocopApi } from './api/ocopApi';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrdersModal from './components/OrdersModal';
import AdminOrdersModal from './components/AdminOrdersModal';
import CreateProductModal from './components/CreateProductModal';

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
  const { currentUser, isLoggedIn, logout, isProducer, isAdmin } = useAuth();
  const { cartCount, addToCart } = useCart();

  // Navigation State
  const [activeNav, setActiveNav] = useState('home');

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [adminOrdersModalOpen, setAdminOrdersModalOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);

  // Data States
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // QR / Trace simulation state
  const [traceBatchCode, setTraceBatchCode] = useState('BATCH-FINHO-2026-001');
  const [traceResult, setTraceResult] = useState(null);

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
      if (query && query.trim()) params.search = query.trim();
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

  const handleAddToCart = async (item) => {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      message.info('Vui lòng đăng nhập để mua đặc sản OCOP');
      return;
    }
    await addToCart(item.id, 1);
  };

  const handleTraceLookup = () => {
    if (!traceBatchCode.trim()) {
      message.warning('Vui lòng nhập mã lô sản xuất OCOP');
      return;
    }
    setTraceResult({
      batchCode: traceBatchCode,
      productName: 'Trà Shan Tuyết Cổ Thụ Fìn Hò',
      producer: 'HTX Chè Shan Tuyết Fìn Hò',
      province: 'Hà Giang',
      starRating: 5,
      harvestDate: '10/09/2026',
      expDate: '10/09/2028',
      certCode: 'OCOP-HG-2024-001',
      events: [
        { type: 'HARVEST', title: 'Thu hái búp tươi 1 tôm 2 lá', time: '10/09/2026 06:30', actor: 'Tổ thu hái HTX Fìn Hò', hash: '1e2f3a4b...5a6b' },
        { type: 'PROCESSING', title: 'Lên men & sao chảo gang truyền thống', time: '10/09/2026 14:00', actor: 'Nghệ nhân Đặng Văn Nam', hash: '2f3a4b5c...7c8d' },
        { type: 'PACKAGING', title: 'Hút chân không & Dán tem QR OCOP', time: '11/09/2026 09:00', actor: 'Xưởng đóng gói Fìn Hò', hash: '3a4b5c6d...9e0f' },
      ]
    });
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
    {
      key: 'orders',
      label: 'Đơn hàng của tôi',
      icon: <HistoryOutlined />,
      onClick: () => setOrdersModalOpen(true),
    },
    ...(isProducer() || isAdmin() ? [
      {
        key: 'admin-orders',
        label: 'Quản lý đơn hàng (HTX / Admin)',
        icon: <OrderedListOutlined />,
        onClick: () => setAdminOrdersModalOpen(true),
      },
      {
        key: 'create-product',
        label: 'Đăng bán sản phẩm OCOP',
        icon: <PlusCircleOutlined />,
        onClick: () => setCreateProductOpen(true),
      }
    ] : []),
    {
      key: 'swagger',
      label: 'Swagger API Docs',
      icon: <FileTextOutlined />,
      onClick: () => window.open('http://localhost:8080/swagger-ui.html', '_blank'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setActiveNav('home')}>
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
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[activeNav]}
            onClick={(e) => setActiveNav(e.key)}
            style={{ background: 'transparent' }}
            items={[
              { key: 'home', icon: <ShopOutlined />, label: 'Sản phẩm OCOP' },
              { key: 'gis', icon: <EnvironmentOutlined />, label: 'Bản đồ GIS' },
              { key: 'trace', icon: <QrcodeOutlined />, label: 'Truy xuất QR' },
            ]}
          />

          {/* Nút Quản lý & Đăng sản phẩm cho Producer / Admin */}
          {isLoggedIn && (isProducer() || isAdmin()) && (
            <Space>
              <Button
                type="default"
                icon={<OrderedListOutlined />}
                onClick={() => setAdminOrdersModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                Quản lý đơn
              </Button>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => setCreateProductOpen(true)}
                style={{ background: '#2e7d32', borderColor: '#4caf50', fontWeight: 'bold' }}
              >
                Đăng sản phẩm
              </Button>
            </Space>
          )}

          {/* Icon Giỏ hàng kèm Badge số lượng */}
          <Badge count={cartCount} showZero={false} offset={[-2, 2]}>
            <Button
              shape="circle"
              icon={<ShoppingCartOutlined style={{ fontSize: 20, color: '#1b5e20' }} />}
              onClick={() => setCartDrawerOpen(true)}
              style={{ background: '#ffd54f', border: 'none' }}
              title="Xem giỏ hàng OCOP"
            />
          </Badge>

          {/* Khu vực Người dùng */}
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
                <Text strong style={{ color: '#274916' }}>Trạng thái hệ thống (Tuần 3 — E-Commerce & Giỏ hàng):</Text>
                <div style={{ fontSize: 13, color: '#389e0d' }}>
                  {healthLoading ? <Spin size="small" /> :
                    healthStatus?.status === 'UP' ? (
                      <span>
                        Backend: <b>UP (Port 8080)</b> | DB: <b>{healthStatus.database}</b> |
                        Giỏ hàng & Đơn hàng: <b>Sẵn sàng ✓</b> |
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

        {/* TAB 1: SẢN PHẨM OCOP (E-COMMERCE) */}
        {activeNav === 'home' && (
          <div>
            {/* TIÊU ĐỀ & BỘ LỌC */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <Title level={2} style={{ margin: 0, color: '#1b5e20' }}>
                  Đặc Sản OCOP Vùng Miền
                </Title>
                <Text type="secondary">
                  Sản phẩm đạt chứng nhận OCOP 3★ – 5★ từ các Hợp tác xã toàn quốc ({products.length} sản phẩm)
                </Text>
              </div>
              <Space wrap size="middle">
                <Search
                  placeholder="Tìm kiếm đặc sản OCOP..."
                  allowClear
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value) loadProducts(selectedStar, '');
                  }}
                  onSearch={(v) => loadProducts(selectedStar, v)}
                  style={{ width: 260 }}
                  prefix={<SearchOutlined />}
                />
                <Select
                  placeholder="Lọc theo sao OCOP"
                  style={{ width: 170 }}
                  allowClear
                  value={selectedStar}
                  onChange={(v) => { setSelectedStar(v); loadProducts(v, searchQuery); }}
                >
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
                    <Card
                      hoverable
                      style={{ height: '100%', display: 'flex', flexDirection: 'column',
                        borderRadius: 10, overflow: 'hidden' }}
                      cover={
                        <div style={{ height: 200, overflow: 'hidden', position: 'relative', background: '#e8f5e9' }}>
                          <img
                            alt={item.name}
                            src={item.thumbnail}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400'; }}
                          />
                          <Tag
                            color={item.ocopStarRating === 5 ? 'gold' : 'blue'}
                            icon={<StarFilled />}
                            style={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }}
                          >
                            OCOP {item.ocopStarRating}★
                          </Tag>
                        </div>
                      }
                      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 16 } }}
                    >
                      <div>
                        <Tag color="green" style={{ marginBottom: 6 }}>{item.category?.name}</Tag>
                        <Title level={5} ellipsis={{ rows: 2 }}
                          style={{ margin: '4px 0 8px', minHeight: 44 }}>{item.name}</Title>
                        <Rate disabled value={item.ocopStarRating} style={{ fontSize: 13 }} />
                        <Paragraph ellipsis={{ rows: 2 }} type="secondary"
                          style={{ fontSize: 13, marginTop: 8 }}>{item.description}</Paragraph>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 18, color: '#d32f2f' }}>
                            {Number(item.price).toLocaleString('vi-VN')} đ
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>/{item.unit}</Text>
                        </div>
                        <div style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
                          <EnvironmentOutlined style={{ color: '#1b5e20', marginRight: 4 }} />
                          {item.producer?.location?.province || item.producer?.name || 'Việt Nam'}
                        </div>
                        <Space style={{ width: '100%' }}>
                          <Button
                            block
                            onClick={() => { setSelectedProduct(item); setDetailModalVisible(true); }}
                            style={{ borderRadius: 6 }}
                          >
                            Chi tiết
                          </Button>
                          <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            disabled={item.stockQuantity <= 0}
                            onClick={() => handleAddToCart(item)}
                            style={{ background: item.stockQuantity <= 0 ? '#d9d9d9' : '#1b5e20', borderColor: '#1b5e20', borderRadius: 6 }}
                            title="Thêm vào giỏ hàng"
                          >
                            {item.stockQuantity <= 0 ? 'Hết hàng' : 'Chọn mua'}
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        )}

        {/* TAB 2: BẢN ĐỒ GIS */}
        {activeNav === 'gis' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Title level={2} style={{ color: '#1b5e20', margin: 0 }}>
                Bản Đồ Vùng Sản Xuất & Hợp Tác Xã OCOP
              </Title>
              <Text type="secondary">
                Định vị không gian địa lý (GIS) các vùng nguyên liệu và chủ thể OCOP trên toàn quốc (Kế hoạch chính thức Tuần 4)
              </Text>
            </div>

            <Row gutter={[20, 20]}>
              <Col xs={24} md={16}>
                <Card style={{ borderRadius: 10, background: '#e8f5e9', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px dashed #81c784' }}>
                  <div>
                    <CompassOutlined style={{ fontSize: 56, color: '#2e7d32', marginBottom: 16 }} />
                    <Title level={4} style={{ color: '#1b5e20' }}>Bản đồ GIS Leaflet + OpenStreetMap</Title>
                    <Paragraph style={{ maxWidth: 500, margin: '0 auto 16px', color: '#555' }}>
                      Hiển thị các Marker tương tác tại tọa độ thực tế: <b>Hà Giang (22.77, 104.91)</b>, <b>Kon Tum (14.98, 107.95)</b>, <b>Bến Tre (10.24, 106.37)</b>, <b>Sơn La (20.84, 104.64)</b>.
                    </Paragraph>
                    <Tag color="green" style={{ padding: '6px 12px', fontSize: 13 }}>
                      🚀 Sẽ tích hợp toàn diện Leaflet Map + Marker Popup tại Tuần 4
                    </Tag>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card title="Chủ thể OCOP tiêu biểu" style={{ borderRadius: 10 }}>
                  <List
                    size="small"
                    dataSource={[
                      { name: 'HTX Chè Shan Tuyết Fìn Hò', province: 'Hà Giang', star: 5, lat: '22.77 N', lng: '104.91 E' },
                      { name: 'HTX Dược liệu Sâm Ngọc Linh', province: 'Kon Tum', star: 5, lat: '14.98 N', lng: '107.95 E' },
                      { name: 'HTX Bưởi Da Xanh Giồng Trôm', province: 'Bến Tre', star: 4, lat: '10.24 N', lng: '106.37 E' },
                      { name: 'HTX Nông nghiệp Mộc Châu', province: 'Sơn La', star: 4, lat: '20.84 N', lng: '104.64 E' },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<EnvironmentOutlined style={{ color: '#1b5e20', fontSize: 20 }} />}
                          title={<b>{item.name}</b>}
                          description={
                            <div>
                              <span>{item.province} ({item.lat}, {item.lng})</span><br />
                              <Tag color="gold" icon={<StarFilled />}>OCOP {item.star}★</Tag>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* TAB 3: TRUY XUẤT QR & BLOCKCHAIN */}
        {activeNav === 'trace' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Title level={2} style={{ color: '#1b5e20', margin: 0 }}>
                Tra Cứu & Truy Xuất Nguồn Gốc OCOP
              </Title>
              <Text type="secondary">
                Kiểm tra tính toàn vẹn chuỗi cung ứng bằng mã băm SHA-256 & Smart Contract Blockchain (Tuần 5 & 6)
              </Text>
            </div>

            <Card style={{ borderRadius: 10, marginBottom: 20 }}>
              <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
                <Input
                  size="large"
                  placeholder="Nhập mã lô sản xuất (Ví dụ: BATCH-FINHO-2026-001)"
                  value={traceBatchCode}
                  onChange={(e) => setTraceBatchCode(e.target.value)}
                  prefix={<QrcodeOutlined />}
                />
                <Button
                  type="primary"
                  size="large"
                  onClick={handleTraceLookup}
                  style={{ background: '#1b5e20', fontWeight: 'bold' }}
                >
                  Tra Cứu Nguồn Gốc
                </Button>
              </Space.Compact>
            </Card>

            {traceResult && (
              <Card
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                    <span>Kết quả truy xuất: <b>{traceResult.productName}</b></span>
                    <Tag color="gold"><StarFilled /> OCOP {traceResult.starRating}★</Tag>
                  </Space>
                }
                style={{ borderRadius: 10, borderColor: '#b7eb8f' }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <div style={{ background: '#f6ffed', padding: 16, borderRadius: 8 }}>
                      <p><b>Mã Lô:</b> <Tag color="blue">{traceResult.batchCode}</Tag></p>
                      <p><b>Hợp tác xã:</b> {traceResult.producer}</p>
                      <p><b>Xuất xứ:</b> {traceResult.province}</p>
                      <p><b>Ngày thu hoạch:</b> {traceResult.harvestDate}</p>
                      <p><b>Hạn sử dụng:</b> {traceResult.expDate}</p>
                      <p><b>Mã chứng nhận:</b> <Tag color="green">{traceResult.certCode}</Tag></p>
                    </div>
                  </Col>
                  <Col xs={24} md={16}>
                    <Title level={5} style={{ color: '#1b5e20' }}>📜 Dòng thời gian chuỗi cung ứng (Supply Chain Events):</Title>
                    <List
                      dataSource={traceResult.events}
                      renderItem={(ev, idx) => (
                        <Card size="small" style={{ marginBottom: 10, background: '#fafafa' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{idx + 1}. {ev.title}</Text>
                            <Tag color="purple">{ev.type}</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                            <span>Thời gian: {ev.time} | Thực hiện: <b>{ev.actor}</b></span>
                            <div>Mã băm dữ liệu (SHA-256): <code>{ev.hash}</code></div>
                          </div>
                        </Card>
                      )}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </Content>

      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #e8e8e8', marginTop: 40 }}>
        <Text strong>ĐỒ ÁN TỐT NGHIỆP — CÔNG NGHỆ THÔNG TIN</Text><br />
        <Text type="secondary" style={{ fontSize: 13 }}>
          Nền tảng thương mại điện tử OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền
        </Text>
      </Footer>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <Modal
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>Đóng</Button>,
            <Button
              key="buy"
              type="primary"
              icon={<ShoppingCartOutlined />}
              disabled={selectedProduct.stockQuantity <= 0}
              style={{ background: '#1b5e20' }}
              onClick={() => { handleAddToCart(selectedProduct); setDetailModalVisible(false); }}
            >
              {selectedProduct.stockQuantity <= 0 ? 'Tạm hết hàng' : `Thêm vào giỏ hàng (${Number(selectedProduct.price).toLocaleString('vi-VN')} đ)`}
            </Button>
          ]}
          width={640}
          title={<Space><SafetyCertificateOutlined style={{ color: '#1b5e20' }} /><b>{selectedProduct.name}</b></Space>}
        >
          <img
            src={selectedProduct.thumbnail}
            alt={selectedProduct.name}
            style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Tag color="gold" icon={<StarFilled />} style={{ fontSize: 14, padding: '4px 8px' }}>
              Chứng nhận OCOP {selectedProduct.ocopStarRating}★
            </Tag>
            <Text strong style={{ fontSize: 22, color: '#d32f2f' }}>
              {Number(selectedProduct.price).toLocaleString('vi-VN')} đ <Text type="secondary" style={{ fontSize: 14 }}>/{selectedProduct.unit}</Text>
            </Text>
          </div>
          <Paragraph><b>Mô tả:</b> {selectedProduct.description}</Paragraph>
          {selectedProduct.culturalStory && (
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginTop: 12 }}>
              <Text strong style={{ color: '#1b5e20' }}>📜 Câu chuyện di sản & Văn hóa OCOP:</Text>
              <Paragraph style={{ margin: '6px 0 0', fontStyle: 'italic' }}>
                "{selectedProduct.culturalStory}"
              </Paragraph>
            </Card>
          )}
          <Divider style={{ margin: '16px 0' }} />
          <div style={{ fontSize: 13, color: '#555' }}>
            <div><b>Cơ sở sản xuất:</b> {selectedProduct.producer?.name}</div>
            <div><b>Địa chỉ:</b> {selectedProduct.producer?.location?.address}, {selectedProduct.producer?.location?.province}</div>
            <div><b>Tồn kho khả dụng:</b> {selectedProduct.stockQuantity} {selectedProduct.unit}</div>
          </div>
        </Modal>
      )}

      {/* CÁC MODAL HỆ THỐNG */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onOpenCheckout={() => setCheckoutModalOpen(true)}
      />
      <CheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderSuccess={() => loadProducts(selectedStar, searchQuery)}
      />
      <OrdersModal open={ordersModalOpen} onClose={() => setOrdersModalOpen(false)} />
      <AdminOrdersModal open={adminOrdersModalOpen} onClose={() => setAdminOrdersModalOpen(false)} />
      <CreateProductModal
        open={createProductOpen}
        onClose={() => setCreateProductOpen(false)}
        onSuccess={() => loadProducts(selectedStar, searchQuery)}
      />
    </Layout>
  );
}

export default App;
