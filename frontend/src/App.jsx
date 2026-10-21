import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Card, Row, Col, Tag, Typography, Rate, Button,
  Input, Select, Space, Spin, Alert, message, Avatar, Dropdown, Badge,
  Modal, Divider, Popconfirm, Empty, List, Timeline
} from 'antd';
import {
  ShopOutlined, EnvironmentOutlined, QrcodeOutlined,
  FileTextOutlined, CheckCircleOutlined, SyncOutlined,
  SearchOutlined, SafetyCertificateOutlined, UserOutlined,
  LogoutOutlined, CrownOutlined, StarFilled, ShoppingCartOutlined,
  PlusCircleOutlined, HistoryOutlined, DeleteOutlined,
  OrderedListOutlined, CompassOutlined, AuditOutlined, RiseOutlined,
  AppstoreOutlined, TeamOutlined
} from '@ant-design/icons';
import { ocopApi } from './api/ocopApi';
import { traceApi } from './api/traceApi';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrdersModal from './components/OrdersModal';
import AdminOrdersModal from './components/AdminOrdersModal';
import CreateProductModal from './components/CreateProductModal';
import ProducerProductsModal from './components/ProducerProductsModal';
import ProducerBatchesModal from './components/ProducerBatchesModal';
import ProducerDashboardModal from './components/ProducerDashboardModal';
import AdminCertificatesModal from './components/AdminCertificatesModal';
import AdminUsersModal from './components/AdminUsersModal';
import AdminCategoriesModal from './components/AdminCategoriesModal';
import GisMap from './components/GisMap';
import adminApi from './api/adminApi';

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
  const [producerProductsModalOpen, setProducerProductsModalOpen] = useState(false);
  const [producerBatchesModalOpen, setProducerBatchesModalOpen] = useState(false);
  const [producerDashboardModalOpen, setProducerDashboardModalOpen] = useState(false);
  const [adminCertificatesModalOpen, setAdminCertificatesModalOpen] = useState(false);
  const [adminUsersModalOpen, setAdminUsersModalOpen] = useState(false);
  const [adminCategoriesModalOpen, setAdminCategoriesModalOpen] = useState(false);
  const [pendingCertCount, setPendingCertCount] = useState(0);

  // Data States
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // QR / Trace state
  const [traceBatchCode, setTraceBatchCode] = useState('BATCH-KD-202601');
  const [traceResult, setTraceResult] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);

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

  const handleTraceLookup = async (overrideCode) => {
    const code = (overrideCode || traceBatchCode || '').trim();
    if (!code) {
      message.warning('Vui lòng nhập mã lô sản xuất OCOP');
      return;
    }
    setTraceLoading(true);
    try {
      const res = await traceApi.getTraceInfo(code);
      if (res && res.success && res.data) {
        setTraceResult(res.data);
        message.success('Đã xác thực nguồn gốc lô sản xuất thành công!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không tìm thấy thông tin mã lô này';
      message.error(msg);
      setTraceResult(null);
    } finally {
      setTraceLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    loadProducts();

    // Tự động kích hoạt tra cứu nếu người dùng quét mã QR có param ?trace=...
    const urlParams = new URLSearchParams(window.location.search);
    const traceParam = urlParams.get('trace');
    if (traceParam) {
      setActiveNav('trace');
      setTraceBatchCode(traceParam);
      handleTraceLookup(traceParam);
    }
  }, []);

  const loadCertStats = async () => {
    if (isAdmin()) {
      try {
        const res = await adminApi.getCertificateStats();
        if (res && res.success) {
          setPendingCertCount(res.data?.pending || 0);
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    loadCertStats();
  }, [currentUser]);

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
        key: 'producer-dashboard',
        label: isAdmin() ? 'Dashboard Thống kê toàn sàn (Admin)' : 'Thống kê & Hiệu quả bán hàng cơ sở',
        icon: <RiseOutlined />,
        onClick: () => setProducerDashboardModalOpen(true),
      },
      {
        key: 'producer-products',
        label: isAdmin() ? 'Quản lý toàn bộ sản phẩm (Admin)' : 'Quản lý sản phẩm & tồn kho cơ sở',
        icon: <ShopOutlined />,
        onClick: () => setProducerProductsModalOpen(true),
      },
      {
        key: 'producer-batches',
        label: 'Quản lý Lô sản xuất & Mã QR Blockchain',
        icon: <QrcodeOutlined />,
        onClick: () => setProducerBatchesModalOpen(true),
      },
      {
        key: 'admin-orders',
        label: isAdmin() ? 'Quản lý toàn bộ đơn hàng (Admin)' : 'Quản lý đơn hàng (Cơ sở sản xuất)',
        icon: <OrderedListOutlined />,
        onClick: () => setAdminOrdersModalOpen(true),
      },
      {
        key: 'create-product',
        label: 'Đăng bán sản phẩm OCOP',
        icon: <PlusCircleOutlined />,
        onClick: () => setCreateProductOpen(true),
      },
      ...(isAdmin() ? [
        {
          key: 'admin-certs',
          label: (
            <span>
              Thẩm định Chứng nhận OCOP{' '}
              {pendingCertCount > 0 && (
                <Badge count={pendingCertCount} size="small" style={{ backgroundColor: '#fa8c16' }} />
              )}
            </span>
          ),
          icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
          onClick: () => setAdminCertificatesModalOpen(true),
        },
        {
          key: 'admin-users',
          label: 'Quản lý Người dùng & Cơ sở sản xuất',
          icon: <TeamOutlined style={{ color: '#1890ff' }} />,
          onClick: () => setAdminUsersModalOpen(true),
        },
        {
          key: 'admin-categories',
          label: 'Quản lý Danh mục Ngành hàng OCOP',
          icon: <AppstoreOutlined style={{ color: '#1b5e20' }} />,
          onClick: () => setAdminCategoriesModalOpen(true),
        },
      ] : [])
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
                icon={<RiseOutlined />}
                onClick={() => setProducerDashboardModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                Thống kê
              </Button>
              <Button
                type="default"
                icon={<ShopOutlined />}
                onClick={() => setProducerProductsModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                {isAdmin() ? 'Quản lý SP' : 'Sản phẩm'}
              </Button>
              <Button
                type="default"
                icon={<QrcodeOutlined />}
                onClick={() => setProducerBatchesModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                Lô & QR
              </Button>
              <Button
                type="default"
                icon={<OrderedListOutlined />}
                onClick={() => setAdminOrdersModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
              >
                {isAdmin() ? 'Đơn hàng (Admin)' : 'Đơn hàng'}
              </Button>
              {isAdmin() && (
                <Badge count={pendingCertCount} offset={[-4, 4]} style={{ backgroundColor: '#fa8c16' }}>
                  <Button
                    type="default"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => setAdminCertificatesModalOpen(true)}
                    style={{ background: '#52c41a', color: '#fff', border: '1px solid #73d13d', fontWeight: 'bold' }}
                  >
                    Thẩm định OCOP
                  </Button>
                </Badge>
              )}
              {isAdmin() && (
                <Button
                  type="default"
                  icon={<TeamOutlined />}
                  onClick={() => setAdminUsersModalOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                >
                  Người dùng
                </Button>
              )}
              {isAdmin() && (
                <Button
                  type="default"
                  icon={<AppstoreOutlined />}
                  onClick={() => setAdminCategoriesModalOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold' }}
                >
                  Danh mục
                </Button>
              )}
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
                <Spin size="large" description="Đang tải sản phẩm từ cơ sở dữ liệu..." />
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
                          {item.ocopCertificate?.status === 'APPROVED' && (
                            <Tag
                              color="success"
                              icon={<SafetyCertificateOutlined />}
                              style={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                fontWeight: 'bold',
                                background: 'rgba(255, 255, 255, 0.95)',
                                color: '#237804',
                                borderColor: '#b7eb8f',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              ✓ Đã Thẩm Định
                            </Tag>
                          )}
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
                Bản Đồ Số Vùng Sản Xuất & Chủ Thể OCOP Việt Nam
              </Title>
              <Text type="secondary">
                Định vị không gian địa lý (GIS) vùng nguyên liệu, khám phá đặc sản OCOP bảo chứng và kết nối trực tiếp với các Hợp tác xã trên toàn quốc
              </Text>
            </div>
            <GisMap
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                setDetailModalVisible(true);
              }}
            />
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
                Xác thực tính toàn vẹn chuỗi cung ứng bằng mã băm SHA-256 và Sổ cái Blockchain bất biến
              </Text>
            </div>

            <Card style={{ borderRadius: 10, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Space.Compact style={{ width: '100%', maxWidth: 640 }}>
                <Input
                  size="large"
                  placeholder="Nhập mã lô sản xuất OCOP (Ví dụ: BATCH-2026-FINHO-01)"
                  value={traceBatchCode}
                  onChange={(e) => setTraceBatchCode(e.target.value)}
                  onPressEnter={() => handleTraceLookup()}
                  prefix={<QrcodeOutlined style={{ color: '#1b5e20' }} />}
                />
                <Button
                  type="primary"
                  size="large"
                  loading={traceLoading}
                  onClick={() => handleTraceLookup()}
                  style={{ background: '#1b5e20', fontWeight: 'bold' }}
                >
                  Tra Cứu Nguồn Gốc
                </Button>
              </Space.Compact>
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                💡 Gợi ý mã lô mẫu có sẵn: <code>BATCH-2026-FINHO-01</code> (Chè Shan Tuyết Fìn Hò)
              </div>
            </Card>

            {traceLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" description="Đang truy xuất và đối chiếu sổ cái Blockchain..." />
              </div>
            ) : traceResult ? (
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 22 }} />
                      <span style={{ fontSize: 16 }}>Kết quả truy xuất: <b>{traceResult.productName}</b></span>
                      <Tag color="gold" style={{ fontWeight: 'bold' }}><StarFilled /> OCOP {traceResult.ocopStarRating}★</Tag>
                    </Space>
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontSize: 12, padding: '4px 10px' }}>
                      BẢO CHỨNG BLOCKCHAIN: {traceResult.blockchainStatus || 'COMMITTED'}
                    </Tag>
                  </div>
                }
                style={{ borderRadius: 10, borderColor: '#b7eb8f', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              >
                <Alert
                  type="success"
                  showIcon
                  message="Dữ liệu chuỗi cung ứng toàn vẹn & minh bạch"
                  description="Mọi hoạt động thu hái, chế biến, kiểm định và đóng gói của lô hàng này đã được băm SHA-256 và ký số trên Sổ cái Blockchain. Không thể làm giả hoặc chỉnh sửa thời gian hồi tố."
                  style={{ marginBottom: 20 }}
                />

                <Row gutter={[24, 24]}>
                  {/* CỘT TRÁI: THÔNG TIN LÔ HÀNG, CƠ SỞ & CHỨNG NHẬN */}
                  <Col xs={24} lg={10}>
                    {/* THẺ SẢN PHẨM & TEM QR */}
                    <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <img
                          src={traceResult.qrCodeUrl}
                          alt="Tem QR"
                          style={{ width: 100, height: 100, borderRadius: 6, border: '1px solid #d9d9d9', background: '#fff', padding: 4 }}
                        />
                        <div>
                          <div style={{ fontSize: 12, color: '#666' }}>Mã Lô Sản Xuất:</div>
                          <Tag color="blue" style={{ fontSize: 14, fontWeight: 'bold', margin: '4px 0' }}>
                            {traceResult.batchCode}
                          </Tag>
                          <div style={{ fontSize: 12 }}><b>Quy mô lô:</b> {traceResult.quantity?.toLocaleString('vi-VN')} {traceResult.unit || 'Hộp'}</div>
                          <div style={{ fontSize: 12 }}><b>NSX:</b> {traceResult.manufactureDate} | <b>HSD:</b> {traceResult.expiryDate}</div>
                        </div>
                      </div>
                    </Card>

                    {/* THẺ NHÀ SẢN XUẤT */}
                    <Card size="small" title="🏛️ Hợp Tác Xã / Cơ Sở Sản Xuất" style={{ marginBottom: 16 }}>
                      <p style={{ margin: '4px 0' }}><b>Tên cơ sở:</b> {traceResult.producerName}</p>
                      <p style={{ margin: '4px 0' }}><b>Mã cơ sở:</b> <code>{traceResult.producerCode}</code></p>
                      <p style={{ margin: '4px 0' }}><b>Xuất xứ địa lý:</b> {traceResult.producerAddress ? `${traceResult.producerAddress}, ` : ''}{traceResult.producerProvince}</p>
                      {traceResult.producerPhone && <p style={{ margin: '4px 0' }}><b>Hotline liên hệ:</b> {traceResult.producerPhone}</p>}
                      <div style={{ marginTop: 8 }}>
                        {traceResult.isProducerVerified ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>Đã thẩm định hồ sơ cơ sở ✓</Tag>
                        ) : (
                          <Tag color="orange">Đang trong tiến trình giám sát</Tag>
                        )}
                      </div>
                    </Card>

                    {/* THẺ CHỨNG NHẬN OCOP */}
                    <Card size="small" title="📜 Chứng Nhận OCOP Cấp Thẩm Quyền" style={{ marginBottom: 16 }}>
                      {traceResult.certificateCode ? (
                        <div>
                          <p style={{ margin: '4px 0' }}><b>Số hiệu giấy CN:</b> <Tag color="green">{traceResult.certificateCode}</Tag></p>
                          <p style={{ margin: '4px 0' }}><b>Cơ quan cấp:</b> {traceResult.certIssuingAuthority}</p>
                          <p style={{ margin: '4px 0' }}><b>Thời hạn hiệu lực:</b> {traceResult.certIssuedDate} đến {traceResult.certExpiryDate}</p>
                        </div>
                      ) : (
                        <Text type="secondary">Chưa khai báo chi tiết số hiệu chứng chỉ.</Text>
                      )}
                    </Card>

                    {/* THẺ BẢO CHỨNG BLOCKCHAIN */}
                    <Card size="small" style={{ background: '#fafafa', border: '1px solid #d9d9d9' }}>
                      <Text strong style={{ color: '#1b5e20', fontSize: 12 }}>🔗 Thông số mã hóa Blockchain:</Text>
                      <div style={{ fontSize: 11, marginTop: 6 }}>
                        <div><b>Mã băm dữ liệu gốc (SHA-256):</b></div>
                        <code style={{ fontSize: 10, wordBreak: 'break-all', display: 'block', background: '#fff', padding: 4, borderRadius: 4, margin: '2px 0 6px' }}>
                          {traceResult.rawDataHash}
                        </code>
                        <div><b>Mã giao dịch Blockchain Tx:</b></div>
                        <code style={{ fontSize: 10, wordBreak: 'break-all', display: 'block', background: '#fff', padding: 4, borderRadius: 4, color: '#722ed1', margin: '2px 0' }}>
                          {traceResult.blockchainTxHash}
                        </code>
                      </div>
                    </Card>
                  </Col>

                  {/* CỘT PHẢI: DÒNG THỜI GIAN NHẬT KÝ CHUỖI CUNG ỨNG */}
                  <Col xs={24} lg={14}>
                    <Title level={4} style={{ color: '#1b5e20', marginBottom: 16 }}>
                      📜 Dòng Thời Gian Nhật Ký Chuỗi Cung Ứng (Supply Chain Ledger)
                    </Title>

                    {(!traceResult.events || traceResult.events.length === 0) ? (
                      <Empty description="Lô này chưa có nhật ký sự kiện chi tiết." />
                    ) : (
                      <Timeline
                        items={traceResult.events.map((ev, idx) => (
                          {
                            color: ev.eventType === 'HARVEST' ? 'green' : ev.eventType === 'PROCESSING' ? 'volcano' : ev.eventType === 'QUALITY_INSPECTION' ? 'blue' : 'purple',
                            children: (
                              <Card size="small" style={{ marginBottom: 12, borderRadius: 8, background: '#fafafa', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text strong style={{ fontSize: 14, color: '#1b5e20' }}>
                                    {idx + 1}. {ev.eventName}
                                  </Text>
                                  <Tag color={ev.eventType === 'HARVEST' ? 'green' : ev.eventType === 'PROCESSING' ? 'volcano' : ev.eventType === 'QUALITY_INSPECTION' ? 'blue' : 'purple'}>
                                    {ev.eventType}
                                  </Tag>
                                </div>
                                {ev.description && (
                                  <Paragraph style={{ margin: '6px 0', fontSize: 13, color: '#555' }}>
                                    {ev.description}
                                  </Paragraph>
                                )}
                                <Divider style={{ margin: '6px 0' }} />
                                <div style={{ fontSize: 11, color: '#777' }}>
                                  <div><b>Đơn vị / Người thực hiện:</b> {ev.actorName}</div>
                                  <div><b>Thời gian ghi nhận:</b> {ev.eventTimestamp}</div>
                                  <div><b>SHA-256 Hash:</b> <code style={{ fontSize: 10 }}>{ev.rawDataHash}</code></div>
                                  <div><b>Tx Hash:</b> <code style={{ fontSize: 10, color: '#722ed1' }}>{ev.blockchainTxHash}</code></div>
                                </div>
                              </Card>
                            ),
                          }
                        ))}
                      />
                    )}
                  </Col>
                </Row>
              </Card>
            ) : null}
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
          {selectedProduct.ocopCertificate && (
            <Card size="small" style={{ background: '#f0f9eb', borderColor: '#b7eb8f', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <Text strong style={{ color: '#1b5e20' }}>
                    Hồ sơ OCOP: {selectedProduct.ocopCertificate.certificateCode}
                  </Text>
                </Space>
                {selectedProduct.ocopCertificate.status === 'APPROVED' ? (
                  <Tag color="success" style={{ fontWeight: 'bold' }}>✓ Đã Thẩm Định</Tag>
                ) : (
                  <Tag color="warning" style={{ fontWeight: 'bold' }}>⏳ Chờ Thẩm Định</Tag>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
                <div><b>Cơ quan cấp quyết định:</b> {selectedProduct.ocopCertificate.issuingAuthority}</div>
                <div><b>Thời hạn hiệu lực:</b> {selectedProduct.ocopCertificate.expiryDate ? dayjs(selectedProduct.ocopCertificate.expiryDate).format('DD/MM/YYYY') : '—'}</div>
              </div>
            </Card>
          )}
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
      <ProducerProductsModal
        open={producerProductsModalOpen}
        onClose={() => setProducerProductsModalOpen(false)}
        onProductChange={() => loadProducts(selectedStar, searchQuery)}
      />
      <ProducerBatchesModal
        open={producerBatchesModalOpen}
        onClose={() => setProducerBatchesModalOpen(false)}
      />
      <ProducerDashboardModal
        open={producerDashboardModalOpen}
        onClose={() => setProducerDashboardModalOpen(false)}
      />
      <AdminCertificatesModal
        open={adminCertificatesModalOpen}
        onClose={() => setAdminCertificatesModalOpen(false)}
        onCertUpdated={() => {
          loadProducts(selectedStar, searchQuery);
          loadCertStats();
        }}
      />
      <AdminUsersModal
        open={adminUsersModalOpen}
        onClose={() => setAdminUsersModalOpen(false)}
      />
      <AdminCategoriesModal
        open={adminCategoriesModalOpen}
        onClose={() => setAdminCategoriesModalOpen(false)}
        onCategoryChange={() => loadProducts(selectedStar, searchQuery)}
      />
    </Layout>
  );
}

export default App;
