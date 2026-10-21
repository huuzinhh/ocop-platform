import React, { useState, useEffect } from 'react';
import {
  Modal, Table, Button, Space, Typography, Card, Row, Col,
  Input, Form, message, Popconfirm, Tag, Tooltip, Image, Empty
} from 'antd';
import {
  AppstoreOutlined, PlusCircleOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, TagsOutlined, FileTextOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import adminApi from '../api/adminApi';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function AdminCategoriesModal({ open, onClose, onCategoryChange }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Form Modal State (Add / Edit)
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      if (res && res.success) {
        setCategories(res.data || []);
      }
    } catch (err) {
      message.error('Không thể tải danh sách danh mục OCOP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      iconUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    });
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record) => {
    setEditingCategory(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      iconUrl: record.iconUrl,
    });
    setFormModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (values) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory.id, values);
        if (res && res.success) {
          message.success(`Đã cập nhật danh mục "${values.name}" thành công`);
        }
      } else {
        const res = await adminApi.createCategory(values);
        if (res && res.success) {
          message.success(`Đã tạo mới danh mục "${values.name}" thành công`);
        }
      }
      setFormModalOpen(false);
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi lưu thông tin danh mục';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (record) => {
    try {
      const res = await adminApi.deleteCategory(record.id);
      if (res && res.success) {
        message.success(res.message || 'Đã xóa danh mục thành công');
        fetchCategories();
        if (onCategoryChange) onCategoryChange();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa danh mục này';
      message.error(msg);
    }
  };

  const totalProductsAcrossCategories = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);

  const columns = [
    {
      title: 'Biểu trưng',
      dataIndex: 'iconUrl',
      key: 'iconUrl',
      width: 90,
      render: (url) => (
        <Image
          src={url || 'https://placehold.co/60x60?text=OCOP'}
          width={48}
          height={48}
          style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #d9d9d9' }}
          fallback="https://placehold.co/60x60?text=OCOP"
        />
      ),
    },
    {
      title: 'Nhóm ngành OCOP',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 14, color: '#1b5e20' }}>
            {record.name}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            Slug: <code>{record.slug}</code>
          </div>
        </div>
      ),
    },
    {
      title: 'Tiêu chuẩn & Mô tả quy chuẩn',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12, color: '#555' }}>
          {desc || 'Chưa cập nhật mô tả quy chuẩn nhóm ngành'}
        </Paragraph>
      ),
    },
    {
      title: 'Quy mô sản phẩm',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 150,
      sorter: (a, b) => a.productCount - b.productCount,
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'} style={{ fontWeight: 'bold', fontSize: 12, padding: '2px 8px' }}>
          {count} sản phẩm OCOP
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa danh mục OCOP"
            description={
              record.productCount > 0
                ? `Danh mục "${record.name}" đang có ${record.productCount} sản phẩm, hệ thống sẽ chặn xóa để bảo toàn dữ liệu!`
                : `Bạn có chắc chắn muốn xóa danh mục "${record.name}"?`
            }
            onConfirm={() => handleDeleteCategory(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.productCount > 0}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={1000}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
            Làm mới
          </Button>,
          <Button key="close" type="primary" onClick={onClose} style={{ background: '#1b5e20' }}>
            Đóng
          </Button>,
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AppstoreOutlined style={{ fontSize: 22, color: '#1b5e20' }} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 'bold', color: '#1b5e20' }}>
                  Quản Lý Danh Mục Ngành Hàng OCOP Chuẩn Quốc Gia
                </div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                  6 nhóm ngành hàng OCOP theo Quyết định số 919/QĐ-TTg của Thủ tướng Chính phủ
                </div>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleOpenCreate}
              style={{ background: '#1b5e20', fontWeight: 'bold' }}
            >
              + Thêm Ngành Hàng
            </Button>
          </div>
        }
        styles={{ body: { padding: '16px 24px' } }}
      >
        {/* KPI NHANH */}
        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col span={12}>
            <Card size="small" style={{ borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tổng Số Nhóm Ngành OCOP</Text>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#1b5e20' }}>
                {categories.length} Nhóm ngành
              </Title>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ borderRadius: 8, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tổng Sản Phẩm Đang Phân Loại</Text>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#096dd9' }}>
                {totalProductsAcrossCategories} Sản phẩm
              </Title>
            </Card>
          </Col>
        </Row>

        {/* BẢNG DANH MỤC */}
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          locale={{ emptyText: <Empty description="Chưa có danh mục ngành hàng nào" /> }}
        />
      </Modal>

      {/* MODAL THÊM / SỬA DANH MỤC */}
      <Modal
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        title={
          <div style={{ fontWeight: 'bold', color: '#1b5e20' }}>
            {editingCategory ? `Cập nhật Nhóm ngành OCOP: ${editingCategory.name}` : '+ Tạo Mới Nhóm Ngành Hàng OCOP'}
          </div>
        }
        footer={[
          <Button key="cancel" onClick={() => setFormModalOpen(false)}>Hủy</Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={() => form.submit()}
            style={{ background: '#1b5e20', fontWeight: 'bold' }}
          >
            {editingCategory ? 'Lưu Thay Đổi' : 'Tạo Ngành Hàng'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            name="name"
            label="Tên Nhóm Ngành Hàng OCOP"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm ngành OCOP' }]}
          >
            <Input placeholder="Ví dụ: Thực phẩm, Đồ uống, Thảo dược, Thủ công mỹ nghệ..." />
          </Form.Item>

          <Form.Item
            name="iconUrl"
            label="Link Hình Ảnh / Biểu Trưng Nhóm Ngành"
          >
            <Input placeholder="https://images.unsplash.com/..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô Tả Quy Chuẩn & Tiêu Chí Phân Nhóm"
          >
            <TextArea
              rows={3}
              placeholder="Quy chuẩn gồm các sản phẩm chế biến, nguyên liệu tươi sống, tiêu chuẩn an toàn..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
