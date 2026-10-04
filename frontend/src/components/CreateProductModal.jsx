import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, Button, Space, Typography,
  Alert, message, Row, Col, Tag, Spin
} from 'antd';
import {
  SafetyCertificateOutlined, ShopOutlined, CrownOutlined
} from '@ant-design/icons';
import { orderApi } from '../api/orderApi';
import { ocopApi } from '../api/ocopApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateProductModal = ({ open, onClose, onSuccess }) => {
  const { currentUser, isProducer, isAdmin } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCatsLoading(true);
      ocopApi.getCategories()
        .then(res => {
          if (res && res.success && res.data) setCategories(res.data);
        })
        .catch(() => {})
        .finally(() => setCatsLoading(false));
    }
  }, [open]);

  const handleClose = () => {
    form.resetFields();
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await orderApi.createProduct({
        name: values.name,
        categoryId: Number(values.categoryId),
        description: values.description,
        culturalStory: values.culturalStory,
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
        unit: values.unit,
        ocopStarRating: Number(values.ocopStarRating),
        thumbnail: values.thumbnail,
      });

      if (res && res.success) {
        message.success('Đăng sản phẩm OCOP thành công!');
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi đăng sản phẩm';
      setErrorMsg(msg);
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const hasPermission = isProducer() || isAdmin();

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={640}
      centered
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
            Đăng Bán Đặc Sản OCOP Mới
          </Title>
        </Space>
      }
    >
      {!hasPermission ? (
        <Alert
          type="warning"
          showIcon
          message="Yêu cầu tài khoản Nhà sản xuất (ROLE_PRODUCER) hoặc Quản trị viên"
          description={
            <div>
              <p>Tài khoản hiện tại <b>{currentUser?.username}</b> chưa có quyền đăng bán sản phẩm.</p>
              <p>Vui lòng đăng xuất và đăng nhập bằng một trong các tài khoản sau:</p>
              <div>• <Tag color="blue">Nhà sản xuất:</Tag> <code>producer_finho</code> / <code>123456</code></div>
              <div>• <Tag color="red">Quản trị viên:</Tag> <code>admin</code> / <code>123456</code></div>
            </div>
          }
          style={{ marginBottom: 16 }}
        />
      ) : (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
          <Space>
            <ShopOutlined style={{ color: '#2e7d32' }} />
            <Text>Đang đăng với tư cách: <b>{currentUser?.fullName}</b></Text>
            {isAdmin() ? <Tag color="red"><CrownOutlined /> Admin</Tag> : <Tag color="blue"><ShopOutlined /> Nhà sản xuất</Tag>}
          </Space>
        </div>
      )}

      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon closable onClose={() => setErrorMsg('')} style={{ marginBottom: 16 }} />
      )}

      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        disabled={!hasPermission}
        initialValues={{
          ocopStarRating: 4,
          stockQuantity: 100,
          unit: 'Hộp',
          thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500',
        }}
      >
        <Form.Item
          name="name"
          label="Tên sản phẩm OCOP"
          rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
        >
          <Input placeholder="Ví dụ: Hồng Trà Shan Tuyết Cổ Thụ Fìn Hò" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="categoryId"
              label="Danh mục ngành hàng"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            >
              <Select loading={catsLoading} placeholder="Chọn danh mục sản phẩm">
                {categories.map(cat => (
                  <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ocopStarRating"
              label="Hạng sao chứng nhận OCOP"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value={5}>⭐⭐⭐⭐⭐ 5 Sao (Cấp Quốc gia)</Option>
                <Option value={4}>⭐⭐⭐⭐ 4 Sao (Cấp Tỉnh)</Option>
                <Option value={3}>⭐⭐⭐ 3 Sao (Cấp Tỉnh)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="price"
              label="Đơn giá (VNĐ)"
              rules={[{ required: true, message: 'Nhập giá bán' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1000}
                step={10000}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                placeholder="250000"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="stockQuantity" label="Số lượng tồn kho" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="unit" label="Đơn vị tính" rules={[{ required: true }]}>
              <Select>
                <Option value="Hộp">Hộp</Option>
                <Option value="Hũ">Hũ</Option>
                <Option value="Chai">Chai</Option>
                <Option value="Gói">Gói</Option>
                <Option value="Kg">Kg</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="thumbnail"
          label="Link hình ảnh đại diện (URL)"
          rules={[{ required: true, message: 'Nhập URL hình ảnh' }]}
        >
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả đặc tính sản phẩm & quy trình chế biến"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
        >
          <TextArea rows={2} placeholder="Hương thơm mộc mạc của núi rừng, vị chát dịu hậu ngọt sâu..." />
        </Form.Item>

        <Form.Item
          name="culturalStory"
          label="Câu chuyện di sản & văn hóa bản địa (OCOP Story)"
        >
          <TextArea rows={2} placeholder="Cây chè Shan Tuyết cổ thụ hàng trăm năm tuổi gắn liền với đời sống..." />
        </Form.Item>

        <Form.Item style={{ marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            disabled={!hasPermission}
            style={{ background: '#1b5e20', height: 44, fontWeight: 'bold' }}
          >
            Đăng Bán Sản Phẩm OCOP Ngay
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProductModal;
