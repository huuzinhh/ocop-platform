import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Table, Button, Space, Tag, Typography, Input, InputNumber,
  Select, Card, Row, Col, Popconfirm, Tooltip, Switch, Tabs,
  DatePicker, message, Empty, Spin, Alert, Form, Badge, Divider, Image
} from 'antd';
import {
  ShopOutlined, PlusCircleOutlined, EditOutlined, DeleteOutlined,
  SyncOutlined, SearchOutlined, SafetyCertificateOutlined, StarFilled,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  FileProtectOutlined, DollarOutlined, AppstoreOutlined, WarningOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ocopApi } from '../api/ocopApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Search, TextArea } = Input;
const { Option } = Select;

const ProducerProductsModal = ({ open, onClose, onProductChange }) => {
  const { currentUser, isProducer, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [selectedStar, setSelectedStar] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Edit / Add Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Quick Inline Edit (Price & Stock)
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [quickEditTarget, setQuickEditTarget] = useState(null);
  const [quickPrice, setQuickPrice] = useState(0);
  const [quickStock, setQuickStock] = useState(0);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Load Categories & Products
  const fetchCategories = async () => {
    try {
      const res = await ocopApi.getCategories();
      if (res && res.success && res.data) {
        setCategories(res.data);
      }
    } catch {
      // Ignored
    }
  };

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const res = await ocopApi.getMyProducts();
      if (res && res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải danh sách sản phẩm';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchMyProducts();
    }
  }, [open]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'ACTIVE').length;
    const totalStock = products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0);
    const lowStock = products.filter(p => (p.stockQuantity || 0) <= 10).length;
    return { total, active, totalStock, lowStock };
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchText) {
        const query = searchText.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(query);
        const matchCert = p.ocopCertificate?.certificateCode?.toLowerCase().includes(query);
        if (!matchName && !matchCert) return false;
      }
      if (selectedStar && p.ocopStarRating !== selectedStar) {
        return false;
      }
      if (selectedCategory && p.category?.id !== selectedCategory) {
        return false;
      }
      if (selectedStatus && p.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [products, searchText, selectedStar, selectedCategory, selectedStatus]);

  // Quick status toggle
  const handleToggleStatus = async (record, checked) => {
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    try {
      const res = await ocopApi.updateProduct(record.id, { status: newStatus });
      if (res && res.success) {
        message.success(`Đã cập nhật trạng thái: ${checked ? 'Đang mở bán' : 'Tạm dừng bán'}`);
        fetchMyProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái';
      message.error(msg);
    }
  };

  // Open Quick Edit for Price & Stock
  const handleOpenQuickEdit = (record) => {
    setQuickEditTarget(record);
    setQuickPrice(record.price || 0);
    setQuickStock(record.stockQuantity || 0);
    setQuickEditModalOpen(true);
  };

  // Submit Quick Edit
  const handleSaveQuickEdit = async () => {
    if (!quickEditTarget) return;
    setQuickSubmitting(true);
    try {
      const res = await ocopApi.updateProduct(quickEditTarget.id, {
        price: Number(quickPrice),
        stockQuantity: Number(quickStock),
      });
      if (res && res.success) {
        message.success('Cập nhật giá bán và tồn kho thành công!');
        setQuickEditModalOpen(false);
        setQuickEditTarget(null);
        fetchMyProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật giá/tồn kho';
      message.error(msg);
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Open Add / Edit Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ACTIVE',
      ocopStarRating: 4,
      stockQuantity: 100,
      unit: 'Hộp',
      thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500',
      issuedDate: dayjs().subtract(1, 'month'),
      expiryDate: dayjs().add(3, 'year'),
      issuingAuthority: 'UBND Tỉnh / Hội đồng OCOP Quốc gia',
    });
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setEditingProduct(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      categoryId: record.category?.id,
      price: record.price,
      stockQuantity: record.stockQuantity,
      unit: record.unit || 'Hộp',
      ocopStarRating: record.ocopStarRating || 4,
      thumbnail: record.thumbnail,
      status: record.status || 'ACTIVE',
      description: record.description,
      culturalStory: record.culturalStory,
      certificateCode: record.ocopCertificate?.certificateCode || '',
      issuedDate: record.ocopCertificate?.issuedDate ? dayjs(record.ocopCertificate.issuedDate) : null,
      expiryDate: record.ocopCertificate?.expiryDate ? dayjs(record.ocopCertificate.expiryDate) : null,
      issuingAuthority: record.ocopCertificate?.issuingAuthority || 'UBND Tỉnh / Hội đồng OCOP Quốc gia',
      documentUrl: record.ocopCertificate?.documentUrl || '',
    });
    setFormModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (values) => {
    setFormSubmitting(true);
    try {
      const payload = {
        name: values.name,
        categoryId: Number(values.categoryId),
        description: values.description,
        culturalStory: values.culturalStory,
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
        unit: values.unit,
        ocopStarRating: Number(values.ocopStarRating),
        thumbnail: values.thumbnail,
        status: values.status,
        certificateCode: values.certificateCode?.trim() || null,
        issuedDate: values.issuedDate ? values.issuedDate.format('YYYY-MM-DD') : null,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        issuingAuthority: values.issuingAuthority?.trim() || null,
        documentUrl: values.documentUrl?.trim() || null,
      };

      let res;
      if (editingProduct) {
        res = await ocopApi.updateProduct(editingProduct.id, payload);
      } else {
        res = await ocopApi.createProduct(payload);
      }

      if (res && res.success) {
        message.success(editingProduct ? 'Cập nhật sản phẩm & chứng nhận OCOP thành công!' : 'Đăng bán sản phẩm OCOP mới thành công!');
        setFormModalOpen(false);
        setEditingProduct(null);
        form.resetFields();
        fetchMyProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi lưu thông tin sản phẩm';
      message.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id) => {
    try {
      const res = await ocopApi.deleteProduct(id);
      if (res && res.success) {
        message.success(res.message || 'Đã xóa / ẩn sản phẩm thành công');
        fetchMyProducts();
        if (onProductChange) onProductChange();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa sản phẩm';
      message.error(msg);
    }
  };

  // Table Columns Definition
  const columns = [
    {
      title: 'Sản phẩm OCOP',
      key: 'product',
      width: 280,
      render: (_, record) => (
        <Space orientation="horizontal" size="middle" align="start">
          <Image
            src={record.thumbnail}
            alt={record.name}
            width={64}
            height={64}
            style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #d9d9d9' }}
            fallback="https://placehold.co/100x100?text=OCOP"
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 14, color: '#1b5e20', lineHeight: 1.3 }}>
              {record.name}
            </div>
            <Space size={4} style={{ marginTop: 4 }} wrap>
              <Tag color="green">{record.category?.name || 'Đặc sản'}</Tag>
              <Tag color="cyan">ĐVT: {record.unit || 'Hộp'}</Tag>
            </Space>
            {isAdmin() && record.producer && (
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Cơ sở: <b>{record.producer.name}</b>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Chứng nhận OCOP',
      key: 'ocopCert',
      width: 220,
      render: (_, record) => {
        const cert = record.ocopCertificate;
        return (
          <div>
            <Space size={4} style={{ marginBottom: 4 }} wrap>
              <Tag color={record.ocopStarRating === 5 ? 'gold' : 'blue'} icon={<StarFilled />} style={{ fontWeight: 'bold' }}>
                OCOP {record.ocopStarRating} Sao
              </Tag>
              {cert?.status === 'APPROVED' && (
                <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 'bold', fontSize: 11 }}>
                  ✓ Đã Duyệt
                </Tag>
              )}
              {cert?.status === 'PENDING' && (
                <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 'bold', fontSize: 11 }}>
                  ⏳ Chờ Duyệt
                </Tag>
              )}
              {cert?.status === 'REJECTED' && (
                <Tooltip title={`Lý do từ chối: ${cert?.rejectionReason || 'Không đạt chuẩn'}`}>
                  <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontWeight: 'bold', fontSize: 11, cursor: 'pointer' }}>
                    ✕ Bị Từ Chối
                  </Tag>
                </Tooltip>
              )}
            </Space>
            {cert?.certificateCode ? (
              <div style={{ fontSize: 12 }}>
                <div><FileProtectOutlined style={{ color: '#2e7d32' }} /> <b>{cert.certificateCode}</b></div>
                <div style={{ color: '#666', fontSize: 11 }}>Cơ quan: {cert.issuingAuthority || 'UBND Tỉnh'}</div>
                {cert.expiryDate && (
                  <div style={{ color: '#888', fontSize: 11 }}>HSD: {dayjs(cert.expiryDate).format('DD/MM/YYYY')}</div>
                )}
                {cert?.status === 'REJECTED' && cert?.rejectionReason && (
                  <div style={{ color: '#cf1322', fontSize: 11, marginTop: 2, background: '#fff1f0', padding: '2px 4px', borderRadius: 4 }}>
                    Lý do: {cert.rejectionReason}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#fa8c16', fontSize: 11 }}>
                <WarningOutlined /> Chưa khai báo số giấy CN
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Đơn giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      sorter: (a, b) => Number(a.price) - Number(b.price),
      render: (price, record) => (
        <Tooltip title="Nhấp để sửa nhanh giá và tồn kho">
          <div
            onClick={() => handleOpenQuickEdit(record)}
            style={{ cursor: 'pointer', padding: '4px 8px', background: '#f6ffed', borderRadius: 4, border: '1px dashed #b7eb8f', display: 'inline-block' }}
          >
            <Text strong style={{ color: '#d32f2f', fontSize: 14 }}>
              {Number(price).toLocaleString('vi-VN')} đ
            </Text>
            <div style={{ fontSize: 10, color: '#52c41a' }}>✏️ Sửa nhanh</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 130,
      sorter: (a, b) => a.stockQuantity - b.stockQuantity,
      render: (stock, record) => {
        const isLow = stock <= 10;
        return (
          <Tooltip title="Nhấp để sửa nhanh giá và tồn kho">
            <div
              onClick={() => handleOpenQuickEdit(record)}
              style={{ cursor: 'pointer', padding: '4px 8px', background: isLow ? '#fff1f0' : '#f0f5ff', borderRadius: 4, border: `1px dashed ${isLow ? '#ffa39e' : '#adc6ff'}`, display: 'inline-block' }}
            >
              <Text strong style={{ color: isLow ? '#cf1322' : '#1d39c4', fontSize: 14 }}>
                {stock} {record.unit || 'Hộp'}
              </Text>
              {isLow && (
                <div style={{ fontSize: 10, color: '#cf1322', fontWeight: 'bold' }}>
                  ⚠️ {stock === 0 ? 'Hết hàng!' : 'Sắp hết!'}
                </div>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => (
        <Space direction="vertical" size={2}>
          <Switch
            checked={status === 'ACTIVE'}
            onChange={(checked) => handleToggleStatus(record, checked)}
            checkedChildren="Đang bán"
            unCheckedChildren="Tạm dừng"
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {status === 'ACTIVE' ? 'Hiển thị trên sàn' : 'Đã ẩn khỏi sàn'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa toàn bộ thông tin & chứng nhận OCOP">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEditModal(record)}
              style={{ background: '#1b5e20' }}
            >
              Sửa
            </Button>
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa sản phẩm"
            description="Bạn có chắc chắn muốn xóa sản phẩm này? (Nếu đã có đơn hàng, hệ thống sẽ tự động chuyển sang trạng thái Ẩn để bảo toàn lịch sử)."
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Xóa ngay"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="default" danger size="small" icon={<DeleteOutlined />} />
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
        footer={null}
        width={1100}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <Space>
              <ShopOutlined style={{ color: '#1b5e20', fontSize: 24 }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
                  {isAdmin() ? 'Quản Lý Danh Sách Toàn Bộ Sản Phẩm OCOP (Admin)' : 'Quản Lý Sản Phẩm, Giá & Tồn Kho Cơ Sở'}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cơ sở: <b>{currentUser?.fullName}</b> ({currentUser?.username})
                </Text>
              </div>
            </Space>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleOpenAddModal}
              style={{ background: '#2e7d32', fontWeight: 'bold' }}
            >
              Đăng sản phẩm mới
            </Button>
          </div>
        }
      >
        {/* STATS OVERVIEW CARDS */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <div style={{ fontSize: 12, color: '#389e0d' }}>Tổng sản phẩm OCOP</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#135200' }}>{stats.total}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
              <div style={{ fontSize: 12, color: '#096dd9' }}>Đang mở bán (ACTIVE)</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#003a8c' }}>{stats.active}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
              <div style={{ fontSize: 12, color: '#722ed1' }}>Tổng số lượng tồn kho</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#391085' }}>{stats.totalStock.toLocaleString('vi-VN')}</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: stats.lowStock > 0 ? '#fff1f0' : '#f6ffed', borderColor: stats.lowStock > 0 ? '#ffa39e' : '#b7eb8f' }}>
              <div style={{ fontSize: 12, color: stats.lowStock > 0 ? '#cf1322' : '#389e0d' }}>Cảnh báo sắp hết / hết hàng</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: stats.lowStock > 0 ? '#a8071a' : '#135200' }}>{stats.lowStock}</div>
            </Card>
          </Col>
        </Row>

        {/* SEARCH & FILTERS BAR */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="Tìm theo tên đặc sản hoặc mã chứng nhận..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />

          <Select
            placeholder="Hạng sao OCOP"
            style={{ width: 160 }}
            allowClear
            value={selectedStar}
            onChange={setSelectedStar}
          >
            <Option value={5}>⭐⭐⭐⭐⭐ 5 Sao</Option>
            <Option value={4}>⭐⭐⭐⭐ 4 Sao</Option>
            <Option value={3}>⭐⭐⭐ 3 Sao</Option>
          </Select>

          <Select
            placeholder="Danh mục"
            style={{ width: 180 }}
            allowClear
            value={selectedCategory}
            onChange={setSelectedCategory}
          >
            {categories.map(c => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>

          <Select
            placeholder="Trạng thái"
            style={{ width: 140 }}
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="ACTIVE">Đang mở bán</Option>
            <Option value="INACTIVE">Tạm dừng bán</Option>
          </Select>

          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchMyProducts}>
            Làm mới
          </Button>
        </div>

        {/* MAIN DATA TABLE */}
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6, showTotal: (total) => `Tổng cộng ${total} sản phẩm` }}
          locale={{ emptyText: <Empty description="Chưa có sản phẩm nào thuộc gian hàng này. Hãy bấm 'Đăng sản phẩm mới'!" /> }}
        />
      </Modal>

      {/* QUICK EDIT PRICE & STOCK MODAL */}
      <Modal
        open={quickEditModalOpen}
        onCancel={() => setQuickEditModalOpen(false)}
        onOk={handleSaveQuickEdit}
        confirmLoading={quickSubmitting}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        title={
          <Space>
            <DollarOutlined style={{ color: '#1b5e20' }} />
            <span>Sửa Nhanh Đơn Giá & Tồn Kho: <b>{quickEditTarget?.name}</b></span>
          </Space>
        }
        width={480}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Đơn giá mới (VNĐ):</Text>
            <InputNumber
              style={{ width: '100%', marginTop: 6 }}
              min={1000}
              step={10000}
              value={quickPrice}
              onChange={(val) => setQuickPrice(val || 0)}
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
            />
          </div>

          <div>
            <Text strong>Số lượng tồn kho khả dụng ({quickEditTarget?.unit || 'Hộp'}):</Text>
            <InputNumber
              style={{ width: '100%', marginTop: 6 }}
              min={0}
              step={10}
              value={quickStock}
              onChange={(val) => setQuickStock(val || 0)}
            />
            {quickStock <= 10 && (
              <Alert
                message="Tồn kho thấp hơn hoặc bằng 10 đơn vị! Sản phẩm sẽ được hiển thị cảnh báo sắp hết hàng."
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* COMPREHENSIVE ADD / EDIT MODAL WITH OCOP CERTIFICATE DECLARATION */}
      <Modal
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        footer={null}
        width={720}
        centered
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1b5e20', fontSize: 22 }} />
            <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
              {editingProduct ? 'Chỉnh Sửa Sản Phẩm & Khai Báo Chứng Nhận OCOP' : 'Đăng Bán Đặc Sản OCOP Mới'}
            </Title>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          size="middle"
        >
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: <span><AppstoreOutlined /> 1. Thông tin sản phẩm</span>,
                children: (
                  <div>
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
                          <Select placeholder="Chọn danh mục sản phẩm">
                            {categories.map(c => (
                              <Option key={c.id} value={c.id}>{c.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="status"
                          label="Trạng thái kinh doanh"
                          rules={[{ required: true }]}
                        >
                          <Select>
                            <Option value="ACTIVE">🟢 Đang mở bán (ACTIVE)</Option>
                            <Option value="INACTIVE">🔴 Tạm dừng / Ẩn (INACTIVE)</Option>
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
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="stockQuantity"
                          label="Tồn kho khả dụng"
                          rules={[{ required: true, message: 'Nhập số lượng tồn' }]}
                        >
                          <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="unit"
                          label="Đơn vị tính"
                          rules={[{ required: true }]}
                        >
                          <Select>
                            <Option value="Hộp">Hộp</Option>
                            <Option value="Hũ">Hũ</Option>
                            <Option value="Chai">Chai</Option>
                            <Option value="Gói">Gói</Option>
                            <Option value="Kg">Kg</Option>
                            <Option value="Túi">Túi</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="thumbnail"
                      label="Link hình ảnh đại diện (URL)"
                      rules={[{ required: true, message: 'Nhập link ảnh sản phẩm' }]}
                    >
                      <Input placeholder="https://images.unsplash.com/..." />
                    </Form.Item>

                    <Form.Item
                      name="description"
                      label="Mô tả đặc tính sản phẩm & quy trình sản xuất"
                      rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                      <TextArea rows={3} placeholder="Hương vị, công dụng, quy trình thu hái..." />
                    </Form.Item>

                    <Form.Item
                      name="culturalStory"
                      label="Câu chuyện di sản & văn hóa bản địa (OCOP Cultural Story)"
                    >
                      <TextArea rows={2} placeholder="Nguồn gốc lịch sử, cây chè cổ thụ, tập quán canh tác..." />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: '2',
                label: <span><SafetyCertificateOutlined /> 2. Khai báo Chứng nhận OCOP</span>,
                children: (
                  <div>
                    <Alert
                      type="info"
                      showIcon
                      message="Thông tin minh bạch chứng nhận OCOP"
                      description="Thông tin chứng nhận OCOP sẽ được hiển thị minh bạch cho khách hàng và liên kết trực tiếp vào hệ thống tem QR truy xuất nguồn gốc sản phẩm."
                      style={{ marginBottom: 16 }}
                    />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="ocopStarRating"
                          label="Hạng sao OCOP công nhận"
                          rules={[{ required: true, message: 'Chọn hạng sao' }]}
                        >
                          <Select>
                            <Option value={5}>⭐⭐⭐⭐⭐ 5 Sao (Cấp Quốc gia)</Option>
                            <Option value={4}>⭐⭐⭐⭐ 4 Sao (Cấp Tỉnh)</Option>
                            <Option value={3}>⭐⭐⭐ 3 Sao (Cấp Tỉnh)</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="certificateCode"
                          label="Số hiệu giấy chứng nhận OCOP"
                          rules={[{ required: true, message: 'Nhập mã chứng nhận OCOP' }]}
                        >
                          <Input placeholder="Ví dụ: OCOP-5S-HG-2023-089" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="issuedDate"
                          label="Ngày cấp chứng nhận"
                          rules={[{ required: true, message: 'Chọn ngày cấp' }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày cấp" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="expiryDate"
                          label="Ngày hết hạn chứng nhận (thường 3 năm)"
                          rules={[{ required: true, message: 'Chọn ngày hết hạn' }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày hết hạn" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="issuingAuthority"
                      label="Cơ quan thẩm quyền cấp chứng nhận"
                      rules={[{ required: true, message: 'Nhập cơ quan cấp' }]}
                    >
                      <Input placeholder="Ví dụ: Hội đồng đánh giá phân hạng sản phẩm OCOP Quốc gia / UBND Tỉnh Hà Giang" />
                    </Form.Item>

                    <Form.Item
                      name="documentUrl"
                      label="Link tài liệu / Quyết định công nhận (Scan/PDF URL)"
                    >
                      <Input placeholder="https://..." />
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          />

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setFormModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={formSubmitting}
              style={{ background: '#1b5e20', fontWeight: 'bold' }}
            >
              {editingProduct ? 'Lưu Thay Đổi Sản Phẩm' : 'Đăng Bán Sản Phẩm OCOP'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ProducerProductsModal;
