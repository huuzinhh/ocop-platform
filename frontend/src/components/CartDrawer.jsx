import React from 'react';
import {
  Drawer, List, Avatar, Button, InputNumber, Space, Typography,
  Divider, Empty, Tag, Popconfirm
} from 'antd';
import {
  DeleteOutlined, ShoppingCartOutlined, StarFilled,
  ArrowRightOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useCart } from '../context/CartContext';

const { Title, Text } = Typography;

const CartDrawer = ({ open, onClose, onOpenCheckout }) => {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();

  const handleCheckout = () => {
    onClose();
    onOpenCheckout();
  };

  return (
    <Drawer
      title={
        <Space>
          <ShoppingCartOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
            Giỏ Hàng Đặc Sản OCOP ({cart.totalItems || 0})
          </Title>
        </Space>
      }
      placement="right"
      width={460}
      open={open}
      onClose={onClose}
      footer={
        cart.items && cart.items.length > 0 ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text type="secondary">Phí vận chuyển:</Text>
              <Tag color="green" icon={<CheckCircleOutlined />}>Miễn phí toàn quốc</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>Tổng thanh toán:</Text>
              <Text strong style={{ fontSize: 22, color: '#d32f2f' }}>
                {Number(cart.totalAmount || 0).toLocaleString('vi-VN')} đ
              </Text>
            </div>
            <Space style={{ width: '100%' }} direction="vertical" size="small">
              <Button
                type="primary"
                size="large"
                block
                icon={<ArrowRightOutlined />}
                onClick={handleCheckout}
                style={{ background: '#1b5e20', height: 48, fontWeight: 'bold', fontSize: 16 }}
              >
                Tiến hành Đặt hàng
              </Button>
              <Popconfirm
                title="Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"
                onConfirm={clearCart}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button type="text" danger block size="small">
                  Làm rỗng giỏ hàng
                </Button>
              </Popconfirm>
            </Space>
          </div>
        ) : null
      }
    >
      {!cart.items || cart.items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Giỏ hàng của bạn đang trống"
          style={{ marginTop: 80 }}
        >
          <Button type="primary" style={{ background: '#1b5e20' }} onClick={onClose}>
            Khám phá đặc sản OCOP
          </Button>
        </Empty>
      ) : (
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={cart.items}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeItem(item.id)}
                />
              ]}
              style={{ padding: '12px 0' }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="square"
                    size={64}
                    src={item.thumbnail}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
                  />
                }
                title={
                  <div>
                    <Text strong style={{ fontSize: 14 }}>{item.productName}</Text>
                    <div>
                      <Tag color={item.ocopStarRating === 5 ? 'gold' : 'blue'} icon={<StarFilled />} style={{ fontSize: 11, padding: '0 4px' }}>
                        {item.ocopStarRating}★
                      </Tag>
                    </div>
                  </div>
                }
                description={
                  <div style={{ marginTop: 6 }}>
                    <div style={{ color: '#d32f2f', fontWeight: 'bold', marginBottom: 4 }}>
                      {Number(item.unitPrice).toLocaleString('vi-VN')} đ <Text type="secondary" style={{ fontSize: 11 }}>/{item.unit}</Text>
                    </div>
                    <Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>Số lượng:</Text>
                      <InputNumber
                        min={1}
                        max={item.stockQuantity || 99}
                        value={item.quantity}
                        onChange={(val) => val && updateQuantity(item.id, val)}
                        size="small"
                        style={{ width: 64 }}
                      />
                      <Text strong style={{ marginLeft: 8, color: '#1b5e20' }}>
                        = {Number(item.totalPrice).toLocaleString('vi-VN')} đ
                      </Text>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};

export default CartDrawer;
