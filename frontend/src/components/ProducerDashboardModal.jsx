import React, { useState, useEffect } from 'react';
import {
  Modal, Row, Col, Card, Typography, Tag, Space, Progress,
  Table, Button, Spin, Empty, Image, Divider, Tooltip, Alert
} from 'antd';
import {
  DollarOutlined, ShoppingCartOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, FireOutlined,
  StarFilled, QrcodeOutlined, SyncOutlined, TrophyOutlined,
  ShopOutlined, RiseOutlined, AppstoreOutlined, ArrowUpOutlined
} from '@ant-design/icons';
import { statsApi } from '../api/statsApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ProducerDashboardModal = ({ open, onClose }) => {
  const { currentUser, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await statsApi.getDashboardStats();
      if (res && res.success) {
        setData(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStats();
    }
  }, [open]);

  // Max revenue for progress percentage calculation in timeline
  const maxDayRevenue = React.useMemo(() => {
    if (!data || !data.revenueTimeline || data.revenueTimeline.length === 0) return 1;
    const maxVal = Math.max(...data.revenueTimeline.map(d => Number(d.revenue || 0)));
    return maxVal > 0 ? maxVal : 1;
  }, [data]);

  const topProductsColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 70,
      align: 'center',
      render: (_, __, index) => {
        if (index === 0) return <span style={{ fontSize: 20 }}>🥇</span>;
        if (index === 1) return <span style={{ fontSize: 20 }}>🥈</span>;
        if (index === 2) return <span style={{ fontSize: 20 }}>🥉</span>;
        return <Tag color="default" style={{ fontWeight: 'bold' }}>#{index + 1}</Tag>;
      },
    },
    {
      title: 'Sản phẩm OCOP',
      key: 'product',
      render: (_, record) => (
        <Space size="middle" align="center">
          <Image
            src={record.thumbnail}
            alt={record.productName}
            width={48}
            height={48}
            style={{ borderRadius: 6, objectFit: 'cover', border: '1px solid #d9d9d9' }}
            fallback="https://placehold.co/100x100?text=OCOP"
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1b5e20' }}>
              {record.productName}
            </div>
            <Space size={4} style={{ marginTop: 2 }}>
              <Tag color={record.ocopStarRating === 5 ? 'gold' : 'blue'} style={{ fontSize: 11 }}>
                <StarFilled /> OCOP {record.ocopStarRating}★
              </Tag>
              <Tag color="cyan" style={{ fontSize: 11 }}>{record.unit || 'Hộp'}</Tag>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
      width: 110,
      align: 'right',
      render: (qty, record) => (
        <div>
          <Text strong style={{ fontSize: 15, color: '#fa8c16' }}>
            {qty.toLocaleString('vi-VN')}
          </Text>
          <div style={{ fontSize: 11, color: '#888' }}>{record.unit || 'Hộp'}</div>
        </div>
      ),
    },
    {
      title: 'Doanh thu đem lại',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 160,
      align: 'right',
      render: (rev) => (
        <Text strong style={{ color: '#d32f2f', fontSize: 14 }}>
          {Number(rev).toLocaleString('vi-VN')} đ
        </Text>
      ),
    },
    {
      title: 'Tồn kho còn',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 120,
      align: 'center',
      render: (stock, record) => {
        const isLow = stock <= 10;
        return (
          <Tag color={isLow ? 'error' : 'success'} style={{ fontWeight: 'bold' }}>
            {stock} {record.unit || 'Hộp'} {isLow && '⚠️'}
          </Tag>
        );
      },
    },
  ];

  const totalOrders = data?.totalOrders || 0;
  const completedRate = totalOrders > 0 ? Math.round(((data?.completedOrders || 0) / totalOrders) * 100) : 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      centered
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 32 }}>
          <Space>
            <RiseOutlined style={{ color: '#1b5e20', fontSize: 24 }} />
            <div>
              <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
                {isAdmin() ? 'Dashboard Thống Kê & Hiệu Quả Toàn Sàn (Admin)' : 'Dashboard Thống Kê & Hiệu Quả Bán Hàng Cơ Sở'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cơ sở: <b>{data?.producerName || currentUser?.fullName}</b> ({data?.producerCode || currentUser?.username})
              </Text>
            </div>
          </Space>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchStats}>
            Cập nhật dữ liệu
          </Button>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
      ) : !data ? (
        <Empty description="Không thể tải dữ liệu thống kê" />
      ) : (
        <div style={{ padding: '8px 0' }}>
          {/* HÀNG 1: 4 THẺ CHỈ SỐ CỐT LÕI (KPI CARDS) */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {/* THẺ 1: DOANH THU THỰC TẾ */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
                  borderColor: '#b7eb8f',
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>TỔNG DOANH THU THỰC TẾ</Text>
                  <DollarOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#135200', margin: '8px 0 4px' }}>
                  {Number(data.totalRevenue).toLocaleString('vi-VN')} <span style={{ fontSize: 14 }}>VNĐ</span>
                </div>
                <div style={{ fontSize: 12, color: '#389e0d' }}>
                  <ArrowUpOutlined /> Doanh thu từ đơn hàng của cơ sở
                </div>
              </Card>
            </Col>

            {/* THẺ 2: TỔNG SỐ ĐƠN HÀNG */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                  borderColor: '#91d5ff',
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>ĐƠN HÀNG HOÀN THÀNH</Text>
                  <ShoppingCartOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#003a8c', margin: '8px 0 4px' }}>
                  {data.completedOrders} <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>/ {data.totalOrders} đơn</span>
                </div>
                <div style={{ fontSize: 12, color: '#096dd9' }}>
                  Tỷ lệ hoàn thành: <b>{completedRate}%</b>
                </div>
              </Card>
            </Col>

            {/* THẺ 3: SẢN LƯỢNG ĐÃ BÁN */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                  borderColor: '#ffd591',
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>SẢN LƯỢNG ĐÃ TIÊU THỤ</Text>
                  <FireOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#d46b08', margin: '8px 0 4px' }}>
                  {data.totalUnitsSold.toLocaleString('vi-VN')} <span style={{ fontSize: 14, fontWeight: 'normal' }}>sản phẩm</span>
                </div>
                <div style={{ fontSize: 12, color: '#ad4e00' }}>
                  Trong tổng số <b>{data.totalProducts}</b> mặt hàng OCOP
                </div>
              </Card>
            </Col>

            {/* THẺ 4: LÔ SẢN XUẤT & BLOCKCHAIN */}
            <Col xs={24} sm={12} lg={6}>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #f9f0ff 0%, #fcffe6 100%)',
                  borderColor: '#d3adf7',
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>LÔ TRUY XUẤT BLOCKCHAIN</Text>
                  <QrcodeOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#531dab', margin: '8px 0 4px' }}>
                  {data.totalBatches} <span style={{ fontSize: 14, fontWeight: 'normal' }}>lô hàng</span>
                </div>
                <div style={{ fontSize: 12, color: '#391085' }}>
                  Đã kích hoạt tem truy xuất QR ✓
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[20, 20]}>
            {/* CỘT TRÁI: BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#1b5e20' }} />
                    <span style={{ fontSize: 15 }}>Doanh Thu 7 Ngày Gần Nhất</span>
                  </Space>
                }
                style={{ borderRadius: 10, height: '100%' }}
              >
                {(!data.revenueTimeline || data.revenueTimeline.length === 0) ? (
                  <Empty description="Chưa có dữ liệu giao dịch trong 7 ngày qua" />
                ) : (
                  <div>
                    {data.revenueTimeline.map((item) => {
                      const rev = Number(item.revenue || 0);
                      const percent = Math.min(100, Math.round((rev / maxDayRevenue) * 100));
                      return (
                        <div key={item.date} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span><b>Ngày {item.date}</b> ({item.orderCount || 0} đơn | {item.unitsSold || 0} món)</span>
                            <Text strong style={{ color: rev > 0 ? '#1b5e20' : '#888' }}>
                              {rev.toLocaleString('vi-VN')} đ
                            </Text>
                          </div>
                          <Progress
                            percent={percent}
                            showInfo={false}
                            strokeColor={rev > 0 ? { '0%': '#52c41a', '100%': '#1b5e20' } : '#d9d9d9'}
                            size="small"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>

            {/* CỘT PHẢI: PHÂN BỔ TRẠNG THÁI ĐƠN HÀNG */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ color: '#1b5e20' }} />
                    <span style={{ fontSize: 15 }}>Tình Trạng Xử Lý Đơn Hàng</span>
                  </Space>
                }
                style={{ borderRadius: 10, height: '100%' }}
              >
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#52c41a' }}><CheckCircleOutlined /> Đã giao thành công</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1b5e20' }}>{data.completedOrders} đơn</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#1890ff' }}><ClockCircleOutlined /> Đang xử lý / giao</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#096dd9' }}>{data.processingOrders} đơn</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#ff4d4f' }}><CloseCircleOutlined /> Đã hủy</div>
                      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#cf1322' }}>{data.cancelledOrders} đơn</div>
                    </div>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <Text strong style={{ fontSize: 13 }}>Chi tiết theo từng trạng thái hệ thống:</Text>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {Object.entries(data.orderStatusDistribution || {}).map(([st, cnt]) => {
                      let color = 'blue';
                      let label = st;
                      if (st === 'DELIVERED') { color = 'green'; label = 'Đã giao (DELIVERED)'; }
                      else if (st === 'CONFIRMED') { color = 'cyan'; label = 'Đã xác nhận (CONFIRMED)'; }
                      else if (st === 'SHIPPING') { color = 'purple'; label = 'Đang giao (SHIPPING)'; }
                      else if (st === 'PENDING') { color = 'orange'; label = 'Chờ xử lý (PENDING)'; }
                      else if (st === 'CANCELLED') { color = 'red'; label = 'Đã hủy (CANCELLED)'; }

                      return (
                        <Tag key={st} color={color} style={{ padding: '4px 10px', fontSize: 13, borderRadius: 6 }}>
                          {label}: <b>{cnt}</b>
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* HÀNG 3: BẢNG XẾP HẠNG TOP SẢN PHẨM BÁN CHẠY NHẤT */}
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
                <span style={{ fontSize: 15 }}>Top Sản Phẩm OCOP Bán Chạy Nhất Của Cơ Sở</span>
              </Space>
            }
            style={{ marginTop: 20, borderRadius: 10 }}
          >
            {(!data.topSellingProducts || data.topSellingProducts.length === 0) ? (
              <Empty description="Chưa có dữ liệu bán hàng cho các sản phẩm" />
            ) : (
              <Table
                dataSource={data.topSellingProducts}
                columns={topProductsColumns}
                rowKey="productId"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default ProducerDashboardModal;
