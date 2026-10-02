import React, { useState, useEffect } from 'react';
import {
  Modal, List, Card, Tag, Typography, Space, Button, Empty,
  Divider, Spin, Badge, message
} from 'antd';
import {
  ShoppingOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TruckOutlined, CreditCardOutlined, SyncOutlined
} from '@ant-design/icons';
import { orderApi } from '../api/orderApi';

const { Title, Text, Paragraph } = Typography;

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

const OrdersModal = ({ open, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingCode, setPayingCode] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMyOrders();
      if (res && res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open]);

  const handleMockPay = async (orderCode, paymentMethod) => {
    setPayingCode(orderCode);
    try {
      const res = await orderApi.mockPay(orderCode, paymentMethod || 'MOCK_VNPAY');
      if (res && res.success) {
        message.success('Thanh toán mô phỏng thành công!');
        fetchOrders();
      }
    } catch (err) {
      message.error('Lỗi thanh toán: ' + err.message);
    } finally {
      setPayingCode(null);
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
      width={720}
      centered
      title={
        <Space>
          <ShoppingOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
            Lịch Sử Đơn Hàng OCOP ({orders.length})
          </Title>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Đang tải lịch sử đơn hàng..." />
        </div>
      ) : orders.length === 0 ? (
        <Empty description="Bạn chưa có đơn hàng nào." style={{ margin: '40px 0' }} />
      ) : (
        <List
          dataSource={orders}
          renderItem={(order) => (
            <Card
              size="small"
              key={order.id}
              style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #e8e8e8' }}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Text strong>Mã đơn:</Text>
                    <Tag color="green" style={{ fontWeight: 'bold' }}>{order.orderCode}</Tag>
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
              <div style={{ background: '#fafafa', padding: 8, borderRadius: 6, fontSize: 12, marginBottom: 8 }}>
                <div><b>Người nhận:</b> {order.recipientName} - {order.recipientPhone}</div>
                <div><b>Địa chỉ:</b> {order.shippingAddress}</div>
                <div>
                  <b>Thanh toán:</b> {order.paymentMethod} (
                  <Tag color={order.paymentStatus === 'SUCCESS' ? 'green' : 'orange'} style={{ fontSize: 11 }}>
                    {order.paymentStatus}
                  </Tag>)
                  {order.trackingCode && (
                    <span style={{ marginLeft: 12 }}>
                      <b>Vận đơn:</b> <Tag color="purple">{order.trackingCode}</Tag>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 15 }}>Tổng thanh toán: </Text>
                  <Text strong style={{ fontSize: 16, color: '#d32f2f' }}>
                    {Number(order.totalAmount).toLocaleString('vi-VN')} đ
                  </Text>
                </div>
                {order.paymentStatus !== 'SUCCESS' && order.paymentMethod !== 'COD' && (
                  <Button
                    type="primary"
                    size="small"
                    danger
                    icon={<CreditCardOutlined />}
                    loading={payingCode === order.orderCode}
                    onClick={() => handleMockPay(order.orderCode, order.paymentMethod)}
                  >
                    Thanh toán mô phỏng ngay
                  </Button>
                )}
              </div>
            </Card>
          )}
        />
      )}
    </Modal>
  );
};

export default OrdersModal;
