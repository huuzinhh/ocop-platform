import React, { useState, useEffect } from 'react';
import {
  Modal, List, Card, Tag, Typography, Space, Button, Empty,
  Select, Spin, message, Row, Col
} from 'antd';
import {
  ShopOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TruckOutlined, SyncOutlined, UserOutlined, CrownOutlined
} from '@ant-design/icons';
import { orderApi } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const getStatusBadge = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return <Tag color="green" icon={<CheckCircleOutlined />}>Đã xác nhận</Tag>;
    case 'SHIPPING':
      return <Tag color="blue" icon={<TruckOutlined />}>Đang vận chuyển</Tag>;
    case 'DELIVERED':
      return <Tag color="cyan" icon={<CheckCircleOutlined />}>Đã giao hàng</Tag>;
    case 'CANCELLED':
      return <Tag color="red">Đã hủy</Tag>;
    default:
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Chờ xác nhận</Tag>;
  }
};

const AdminOrdersModal = ({ open, onClose }) => {
  const { currentUser, isAdmin, isProducer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingCode, setUpdatingCode] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Backend /api/v1/orders/all tự động lọc đơn hàng theo quyền:
      // Admin xem toàn bộ hệ thống, Nhà sản xuất chỉ xem đơn chứa sản phẩm của mình
      const res = await orderApi.getAllOrders();
      if (res && res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
      message.error(isAdmin() ? 'Không thể tải danh sách đơn hàng toàn hệ thống' : 'Không thể tải danh sách đơn hàng của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open]);

  const handleStatusChange = async (orderCode, newStatus) => {
    setUpdatingCode(orderCode);
    try {
      const res = await orderApi.updateStatus(orderCode, newStatus);
      if (res && res.success) {
        message.success(`Đã cập nhật trạng thái đơn ${orderCode} sang ${newStatus}`);
        fetchOrders();
      }
    } catch (err) {
      message.error('Lỗi cập nhật trạng thái: ' + err.message);
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="refresh" icon={<SyncOutlined />} onClick={fetchOrders}>
          Làm mới
        </Button>,
        <Button key="close" type="primary" style={{ background: '#1b5e20' }} onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={800}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
          <Space>
            {isAdmin() ? (
              <CrownOutlined style={{ color: '#d32f2f', fontSize: 20 }} />
            ) : (
              <ShopOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
            )}
            <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
              {isAdmin() ? 'Quản Lý Toàn Bộ Đơn Hàng Hệ Thống' : 'Quản Lý Đơn Hàng Của Nhà Sản Xuất'} ({orders.length})
            </Title>
          </Space>
          {isAdmin() ? (
            <Tag color="red">Toàn hệ thống</Tag>
          ) : (
            <Tag color="blue"><ShopOutlined /> {currentUser?.fullName}</Tag>
          )}
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip={isAdmin() ? "Đang tải toàn bộ đơn hàng..." : "Đang tải đơn hàng của cơ sở..."} />
        </div>
      ) : orders.length === 0 ? (
        <Empty
          description={
            isAdmin()
              ? "Chưa có đơn hàng nào trong toàn hệ thống."
              : "Chưa có đơn hàng nào đặt mua sản phẩm của cơ sở bạn."
          }
          style={{ margin: '40px 0' }}
        />
      ) : (
        <List
          dataSource={orders}
          renderItem={(order) => (
            <Card
              size="small"
              key={order.id}
              style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #d9d9d9' }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Text strong>Mã đơn:</Text>
                    <Tag color="green" style={{ fontWeight: 'bold' }}>{order.orderCode}</Tag>
                    <Tag color="blue"><UserOutlined /> {order.username}</Tag>
                  </Space>
                  <div>{getStatusBadge(order.status)}</div>
                </div>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}
                </Text>
              }
            >
              {/* Danh sách món */}
              <div style={{ marginBottom: 12 }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: '1px dashed #f0f0f0',
                      fontSize: 13
                    }}
                  >
                    <div>
                      <Text strong>{item.productName}</Text> x <Tag color="blue">{item.quantity}</Tag>
                    </div>
                    <Text style={{ color: '#d32f2f' }}>
                      {Number(item.totalPrice).toLocaleString('vi-VN')} đ
                    </Text>
                  </div>
                ))}
              </div>

              {/* Thông tin vận chuyển và thanh toán */}
              <Row gutter={16} style={{ background: '#fafafa', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 12 }}>
                <Col span={12}>
                  <div><b>Người nhận:</b> {order.recipientName} ({order.recipientPhone})</div>
                  <div><b>Địa chỉ:</b> {order.shippingAddress}</div>
                  {order.note && <div><b>Ghi chú:</b> <i>{order.note}</i></div>}
                </Col>
                <Col span={12}>
                  <div>
                    <b>Thanh toán:</b> {order.paymentMethod} (
                    <Tag color={order.paymentStatus === 'SUCCESS' ? 'green' : 'orange'} style={{ fontSize: 11 }}>
                      {order.paymentStatus}
                    </Tag>)
                  </div>
                  {order.trackingCode && (
                    <div><b>Vận đơn:</b> <Tag color="purple">{order.trackingCode}</Tag> ({order.shipmentStatus})</div>
                  )}
                  <div><b>Tổng giá trị:</b> <Text strong style={{ color: '#d32f2f', fontSize: 14 }}>{Number(order.totalAmount).toLocaleString('vi-VN')} đ</Text></div>
                </Col>
              </Row>

              {/* Thay đổi trạng thái đơn hàng */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f6ffed', padding: '6px 12px', borderRadius: 6 }}>
                <Text strong style={{ color: '#1b5e20' }}>Cập nhật trạng thái:</Text>
                <Select
                  value={order.status}
                  style={{ width: 180 }}
                  loading={updatingCode === order.orderCode}
                  onChange={(val) => handleStatusChange(order.orderCode, val)}
                >
                  <Option value="PENDING">Chờ xác nhận</Option>
                  <Option value="CONFIRMED">Đã xác nhận</Option>
                  <Option value="SHIPPING">Đang giao hàng</Option>
                  <Option value="DELIVERED">Đã giao thành công</Option>
                  <Option value="CANCELLED">Hủy đơn hàng</Option>
                </Select>
              </div>
            </Card>
          )}
        />
      )}
    </Modal>
  );
};

export default AdminOrdersModal;
