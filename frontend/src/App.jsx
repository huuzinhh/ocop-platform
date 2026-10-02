import React, { useState, useEffect } from 'react';
import { 
  Layout, Menu, Card, Row, Col, Tag, Typography, Rate, Button, 
  Input, Select, Space, Badge, Modal, Spin, Alert, message 
} from 'antd';
import { 
  ShopOutlined, EnvironmentOutlined, QrcodeOutlined, 
  FileTextOutlined, CheckCircleOutlined, SyncOutlined, 
  SearchOutlined, SafetyCertificateOutlined 
} from '@ant-design/icons';
import { ocopApi } from './api/ocopApi';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Kiểm tra sức khỏe hệ thống Backend & PostgreSQL
  const checkSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await ocopApi.checkHealth();
      if (res && res.success) {
        setHealthStatus(res.data);
      }
    } catch (err) {
      setHealthStatus({ status: 'DOWN', error: err.message });
    } finally {
      setHealthLoading(false);
    }
  };

  // 2. Tải danh sách sản phẩm OCOP từ Backend
  const loadProducts = async (star, query) => {
    setProductsLoading(true);
    try {
      const params = {};
      if (star) params.starRating = star;
      if (query) params.search = query;
      const res = await ocopApi.getProducts(params);
      if (res && res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      message.error('Không thể tải danh sách sản phẩm từ máy chủ backend');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    loadProducts();
  }, []);

  const handleStarFilter = (value) => {
    setSelectedStar(value);
    loadProducts(value, searchQuery);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    loadProducts(selectedStar, value);
  };

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* HEADER */}
      <Header style={{ 
        background: '#1b5e20', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: '#ffd54f' }} />
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
              OCOP VIỆT NAM
            </Title>
            <Text style={{ color: '#c8e6c9', fontSize: 11 }}>
              Sàn Thương Mại Điện Tử & Truy Xuất Nguồn Gốc Đặc Sản
            </Text>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['home']}
          style={{ background: 'transparent', minWidth: 420 }}
          items={[
            { key: 'home', icon: <ShopOutlined />, label: 'Sản phẩm OCOP' },
            { key: 'gis', icon: <EnvironmentOutlined />, label: 'Bản đồ GIS' },
            { key: 'trace', icon: <QrcodeOutlined />, label: 'Truy xuất QR' },
            { 
              key: 'swagger', 
              icon: <FileTextOutlined />, 
              label: 'Swagger API',
              onClick: () => window.open('http://localhost:8080/swagger-ui.html', '_blank')
            },
          ]}
        />
      </Header>

      {/* CONTENT */}
      <Content style={{ padding: '30px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {/* BANNER TRẠNG THÁI HỆ THỐNG */}
        <Card 
          size="small" 
          style={{ 
            marginBottom: 24, 
            borderRadius: 8, 
            border: '1px solid #b7eb8f', 
            background: '#f6ffed' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Space orientation="horizontal" size="middle">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <Text strong style={{ color: '#274916' }}>Trạng thái tích hợp Milestone 1 (Tuần 1):</Text>
                <div style={{ fontSize: 13, color: '#389e0d' }}>
                  {healthLoading ? (
                    <Spin size="small" />
                  ) : healthStatus?.status === 'UP' ? (
                    <span>
                      Backend: <b>Hoạt động (Port 8080)</b> | Database: <b>{healthStatus.database} ({healthStatus.databaseEngine})</b> | Java: <b>{healthStatus.javaVersion}</b>
                    </span>
                  ) : (
                    <span style={{ color: '#cf1322' }}>
                      Mất kết nối tới Backend Spring Boot ({healthStatus?.error || 'DOWN'})
                    </span>
                  )}
                </div>
              </div>
            </Space>
            <Button 
              size="small" 
              icon={<SyncOutlined spin={healthLoading} />} 
              onClick={checkSystemHealth}
            >
              Kiểm tra lại
            </Button>
          </div>
        </Card>

        {/* HERO TITLE & BỘ LỌC */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1b5e20' }}>
              Đặc Sản OCOP Vùng Miền
            </Title>
            <Text type="secondary">
              Khám phá các sản phẩm đạt chứng nhận OCOP 3 sao - 5 sao từ các Hợp tác xã trên toàn quốc
            </Text>
          </div>

          <Space wrap size="middle">
            <Search
              placeholder="Tìm kiếm đặc sản OCOP..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 260 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Lọc theo sao OCOP"
              style={{ width: 170 }}
              allowClear
              onChange={handleStarFilter}
            >
              <Option value={null}>Tất cả hạng sao</Option>
              <Option value={5}>⭐⭐⭐⭐⭐ 5 Sao</Option>
              <Option value={4}>⭐⭐⭐⭐ 4 Sao</Option>
              <Option value={3}>⭐⭐⭐ 3 Sao</Option>
            </Select>
          </Space>
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Đang kết nối Database và tải sản phẩm..." />
          </div>
        ) : products.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40, borderRadius: 8 }}>
            <Text type="secondary">Không tìm thấy sản phẩm OCOP nào phù hợp.</Text>
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {products.map((item) => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 8, overflow: 'hidden' }}
                  cover={
                    <div style={{ height: 200, overflow: 'hidden', position: 'relative', background: '#e0e0e0' }}>
                      <img
                        alt={item.name}
                        src={item.thumbnail || 'https://via.placeholder.com/300x200?text=OCOP+Product'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Tag 
                        color={item.ocopStarRating === 5 ? 'gold' : 'blue'}
                        style={{ position: 'absolute', top: 10, right: 10, fontWeight: 'bold' }}
                      >
                        OCOP {item.ocopStarRating} SAO
                      </Tag>
                    </div>
                  }
                  bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 16 }}
                >
                  <div>
                    <Tag color="green" style={{ marginBottom: 6 }}>
                      {item.category?.name || 'Đặc sản'}
                    </Tag>
                    <Title level={5} ellipsis={{ rows: 2 }} style={{ margin: '4px 0 8px', minHeight: 44 }}>
                      {item.name}
                    </Title>
                    <Rate disabled defaultValue={item.ocopStarRating} style={{ fontSize: 13, marginBottom: 8 }} />
                    <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
                      {item.description}
                    </Paragraph>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 18, color: '#d32f2f' }}>
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>/{item.unit}</Text>
                    </div>
                    
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                      <EnvironmentOutlined style={{ marginRight: 4, color: '#1b5e20' }} />
                      {item.producer?.name || 'HTX Nông Nghiệp'}
                    </div>

                    <Button 
                      type="primary" 
                      block 
                      style={{ background: '#2e7d32', borderColor: '#2e7d32', borderRadius: 6 }}
                      onClick={() => handleViewDetail(item)}
                    >
                      Chi tiết & Nguồn gốc
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* MODAL CHI TIẾT SẢN PHẨM & CÂU CHUYỆN VĂN HÓA */}
        <Modal
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#2e7d32' }} />
              <span>{selectedProduct?.name}</span>
            </Space>
          }
          open={modalVisible}
          onOk={() => setModalVisible(false)}
          onCancel={() => setModalVisible(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              Đóng
            </Button>,
            <Button 
              key="trace" 
              type="primary" 
              icon={<QrcodeOutlined />} 
              style={{ background: '#1b5e20' }}
              onClick={() => message.info('Tính năng tra cứu Blockchain chi tiết sẽ hoàn thiện ở Tuần 6!')}
            >
              Tra cứu Blockchain
            </Button>
          ]}
        >
          {selectedProduct && (
            <div>
              <Row gutter={16}>
                <Col span={10}>
                  <img
                    alt={selectedProduct.name}
                    src={selectedProduct.thumbnail}
                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
                  />
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <Rate disabled defaultValue={selectedProduct.ocopStarRating} />
                    <div style={{ fontWeight: 'bold', color: '#b78103' }}>
                      Chứng nhận OCOP {selectedProduct.ocopStarRating} Sao
                    </div>
                  </div>
                </Col>
                <Col span={14}>
                  <Paragraph><b>Đơn giá:</b> <span style={{ color: '#d32f2f', fontSize: 16, fontWeight: 'bold' }}>{Number(selectedProduct.price).toLocaleString('vi-VN')} đ / {selectedProduct.unit}</span></Paragraph>
                  <Paragraph><b>Danh mục:</b> {selectedProduct.category?.name}</Paragraph>
                  <Paragraph><b>Đơn vị sản xuất:</b> {selectedProduct.producer?.name}</Paragraph>
                  <Paragraph><b>Giới thiệu sản phẩm:</b> {selectedProduct.description}</Paragraph>
                </Col>
              </Row>

              <div style={{ marginTop: 20, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px dashed #b7eb8f' }}>
                <Title level={5} style={{ color: '#274916', marginTop: 0 }}>
                  📜 Câu chuyện sản phẩm & Bản sắc văn hóa vùng miền:
                </Title>
                <Paragraph style={{ margin: 0, fontStyle: 'italic', color: '#135200' }}>
                  "{selectedProduct.culturalStory || 'Đang cập nhật câu chuyện di sản OCOP...'}"
                </Paragraph>
              </div>
            </div>
          )}
        </Modal>
      </Content>

      {/* FOOTER */}
      <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #e8e8e8', marginTop: 40 }}>
        <Text strong>ĐỒ ÁN TỐT NGHIỆP CÔNG NGHỆ THÔNG TIN</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 13 }}>
          Nền tảng thương mại điện tử OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;
