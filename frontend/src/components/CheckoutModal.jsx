import React, { useState } from 'react';
import {
  Modal, Form, Input, Radio, Button, Space, Typography,
  Divider, Card, Result, Tag, Alert, message
} from 'antd';
import {
  ShopOutlined, CheckCircleOutlined, CreditCardOutlined,
  DollarOutlined, QrcodeOutlined, TruckOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderApi } from '../api/orderApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CheckoutModal = ({ open, onClose, onOrderSuccess }) => {
  const { currentUser } = useAuth();
  const { cart, fetchCart } = useCart();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paying, setPaying] = useState(false);

  const handleClose = () => {
    form.resetFields();
    setCreatedOrder(null);
    onClose();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const res = await orderApi.createOrder({
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        shippingAddress: values.shippingAddress,
        note: values.note,
        paymentMethod: values.paymentMethod,
      });

      if (res && res.success && res.data) {
        setCreatedOrder(res.data);
        await fetchCart();
        message.success('Đặt hàng thành công! Mã đơn: ' + res.data.orderCode);
        if (onOrderSuccess) onOrderSuccess(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đặt hàng thất bại';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockPay = async (method) => {
    if (!createdOrder) return;
    setPaying(true);
    try {
      const res = await orderApi.mockPay(createdOrder.orderCode, method || createdOrder.paymentMethod);
      if (res && res.success && res.data) {
        setCreatedOrder(res.data);
        message.success('Thanh toán mô phỏng thành công! Đơn hàng đã được xác nhận.');
      }
    } catch (err) {
      message.error('Lỗi thanh toán: ' + err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={560}
      centered
      title={
        <Space>
          <ShopOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
            {createdOrder ? 'Xác Nhận Đơn Hàng OCOP' : 'Đặt Hàng Đặc Sản OCOP'}
          </Title>
        </Space>
      }
    >
      {createdOrder ? (
        <div>
          <Result
            status={createdOrder.paymentStatus === 'SUCCESS' || createdOrder.paymentMethod === 'COD' ? 'success' : 'info'}
            title={
              createdOrder.paymentStatus === 'SUCCESS'
                ? 'Đã Thanh Toán & Xác Nhận Đơn Hàng!'
                : 'Đặt Hàng Thành Công!'
            }
            subTitle={
              <div>
                Mã đơn hàng: <Tag color="green" style={{ fontSize: 14, fontWeight: 'bold' }}>{createdOrder.orderCode}</Tag>
                <br />
                Mã vận đơn: <Tag color="blue">{createdOrder.trackingCode || 'GHTK-OCOP'}</Tag>
              </div>
            }
            extra={[
              createdOrder.paymentStatus !== 'SUCCESS' && createdOrder.paymentMethod !== 'COD' ? (
                <div key="pay" style={{ marginBottom: 16 }}>
                  <Alert
                    message="Thanh toán mô phỏng (Đồ án tốt nghiệp)"
                    description="Nhấn nút bên dưới để mô phỏng luồng thanh toán thành công qua VNPay/MoMo mà không trừ tiền thật."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12, textAlign: 'left' }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<CreditCardOutlined />}
                    loading={paying}
                    onClick={() => handleMockPay(createdOrder.paymentMethod)}
                    style={{ background: '#d32f2f', height: 44, fontWeight: 'bold' }}
                    block
                  >
                    Mô phỏng Thanh toán Ngay ({Number(createdOrder.totalAmount).toLocaleString('vi-VN')} đ)
                  </Button>
                </div>
              ) : (
                <div key="status" style={{ marginBottom: 12 }}>
                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ padding: '6px 12px', fontSize: 13 }}>
                    Trạng thái: {createdOrder.status} | Thanh toán: {createdOrder.paymentStatus}
                  </Tag>
                </div>
              ),
              <Button key="close" block onClick={handleClose}>
                Tiếp tục mua sắm
              </Button>
            ]}
          />
        </div>
      ) : (
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          initialValues={{
            recipientName: currentUser?.fullName || '',
            recipientPhone: currentUser?.phone || '',
            paymentMethod: 'MOCK_VNPAY',
          }}
        >
          {/* Tóm tắt giỏ hàng */}
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Số lượng sản phẩm:</Text>
              <Text strong>{cart.totalItems} món</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Phí vận chuyển:</Text>
              <Tag color="green">Miễn phí</Tag>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text strong style={{ fontSize: 16 }}>Tổng số tiền:</Text>
              <Text strong style={{ fontSize: 20, color: '#d32f2f' }}>
                {Number(cart.totalAmount || 0).toLocaleString('vi-VN')} đ
              </Text>
            </div>
          </Card>

          <Form.Item
            name="recipientName"
            label="Họ và tên người nhận"
            rules={[{ required: true, message: 'Vui lòng nhập tên người nhận' }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="recipientPhone"
            label="Số điện thoại nhận hàng"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Ví dụ: 0912345678" />
          </Form.Item>

          <Form.Item
            name="shippingAddress"
            label="Địa chỉ nhận hàng chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ nhận hàng' }]}
          >
            <Input placeholder="Số nhà, ngõ/ngách, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú đơn hàng (tuỳ chọn)">
            <TextArea rows={2} placeholder="Yêu cầu đóng gói, thời gian giao hàng mong muốn..." />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            rules={[{ required: true }]}
          >
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="MOCK_VNPAY">
                  <Space>
                    <QrcodeOutlined style={{ color: '#005baa' }} />
                    <b>Mô phỏng Cổng VNPay QR</b>
                    <Tag color="blue">Mô phỏng</Tag>
                  </Space>
                </Radio>
                <Radio value="MOCK_MOMO">
                  <Space>
                    <DollarOutlined style={{ color: '#a50064' }} />
                    <b>Mô phỏng Ví MoMo</b>
                    <Tag color="magenta">Mô phỏng</Tag>
                  </Space>
                </Radio>
                <Radio value="COD">
                  <Space>
                    <TruckOutlined style={{ color: '#1b5e20' }} />
                    <b>Thanh toán khi nhận hàng (COD)</b>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginTop: 20 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{ background: '#1b5e20', height: 48, fontWeight: 'bold', fontSize: 16 }}
            >
              Xác Nhận Đặt Hàng ({Number(cart.totalAmount || 0).toLocaleString('vi-VN')} đ)
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default CheckoutModal;
