import React, { useState, useEffect } from 'react';
import {
  Modal, Table, Button, Space, Tag, Typography, Input, InputNumber,
  Select, Card, Row, Col, Popconfirm, Tooltip, DatePicker,
  message, Empty, Spin, Alert, Form, Badge, Divider, Timeline, Image, Drawer
} from 'antd';
import {
  QrcodeOutlined, PlusCircleOutlined, SyncOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, FileTextOutlined, CalendarOutlined, UserOutlined,
  SendOutlined, DownloadOutlined, PrinterOutlined, ToolOutlined,
  ExperimentOutlined, InboxOutlined, CarOutlined, StarFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { traceApi } from '../api/traceApi';
import { ocopApi } from '../api/ocopApi';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const getEventTypeBadge = (type) => {
  switch (type) {
    case 'HARVEST':
      return { label: 'Thu hái / Khai thác', color: 'green', icon: <CalendarOutlined /> };
    case 'PROCESSING':
      return { label: 'Chế biến / Sản xuất', color: 'volcano', icon: <ToolOutlined /> };
    case 'QUALITY_INSPECTION':
      return { label: 'Kiểm nghiệm chất lượng', color: 'blue', icon: <ExperimentOutlined /> };
    case 'PACKAGING':
      return { label: 'Đóng gói & Dán tem', color: 'purple', icon: <InboxOutlined /> };
    case 'TRANSPORT':
      return { label: 'Vận chuyển / Phân phối', color: 'cyan', icon: <CarOutlined /> };
    default:
      return { label: type, color: 'default', icon: <CheckCircleOutlined /> };
  }
};

const ProducerBatchesModal = ({ open, onClose }) => {
  const { currentUser, isProducer, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [myProducts, setMyProducts] = useState([]);

  // Create Batch State
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchForm] = Form.useForm();

  // View QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBatchForQr, setSelectedBatchForQr] = useState(null);

  // Supply Chain Events Drawer State
  const [eventsDrawerOpen, setEventsDrawerOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Add Event Form State
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventForm] = Form.useForm();

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await traceApi.getBatches();
      if (res && res.success) {
        setBatches(res.data || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi tải danh sách lô sản xuất';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await ocopApi.getMyProducts();
      if (res && res.success) {
        setMyProducts(res.data || []);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (open) {
      fetchBatches();
      fetchProducts();
    }
  }, [open]);

  // Load events for a batch
  const handleOpenEventsDrawer = async (batch) => {
    setActiveBatch(batch);
    setEventsDrawerOpen(true);
    setEventsLoading(true);
    try {
      const res = await traceApi.getBatchEvents(batch.id);
      if (res && res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      message.error('Không thể tải nhật ký chuỗi cung ứng');
    } finally {
      setEventsLoading(false);
    }
  };

  // Submit Create Batch
  const handleCreateBatch = async (values) => {
    setBatchSubmitting(true);
    try {
      const payload = {
        productId: Number(values.productId),
        batchCode: values.batchCode?.trim() || null,
        manufactureDate: values.manufactureDate.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        quantity: Number(values.quantity),
      };

      const res = await traceApi.createBatch(payload);
      if (res && res.success) {
        message.success('Tạo lô sản xuất & sinh mã QR thành công!');
        setCreateBatchOpen(false);
        batchForm.resetFields();
        fetchBatches();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi tạo lô sản xuất';
      message.error(msg);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Submit Add Event
  const handleAddEvent = async (values) => {
    if (!activeBatch) return;
    setEventSubmitting(true);
    try {
      const payload = {
        eventType: values.eventType,
        eventName: values.eventName,
        description: values.description,
        actorName: values.actorName,
        eventTimestamp: values.eventTimestamp ? values.eventTimestamp.format('YYYY-MM-DD HH:mm:ss') : null,
      };

      const res = await traceApi.addEvent(activeBatch.id, payload);
      if (res && res.success) {
        message.success('Ghi nhật ký sự kiện chuỗi cung ứng thành công!');
        setAddEventOpen(false);
        eventForm.resetFields();
        // Refresh events list
        const evRes = await traceApi.getBatchEvents(activeBatch.id);
        if (evRes && evRes.success) setEvents(evRes.data || []);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi ghi sự kiện chuỗi cung ứng';
      message.error(msg);
    } finally {
      setEventSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã Lô & Tem QR',
      key: 'batch',
      width: 240,
      render: (_, record) => (
        <Space size="middle" align="center">
          <Image
            src={record.qrCodeUrl}
            alt={record.batchCode}
            width={56}
            height={56}
            preview={false}
            style={{ borderRadius: 6, border: '1px solid #d9d9d9', cursor: 'pointer' }}
            onClick={() => { setSelectedBatchForQr(record); setQrModalOpen(true); }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1b5e20' }}>
              {record.batchCode}
            </div>
            <Button
              type="link"
              size="small"
              icon={<QrcodeOutlined />}
              style={{ padding: 0, fontSize: 12 }}
              onClick={() => { setSelectedBatchForQr(record); setQrModalOpen(true); }}
            >
              Phóng to tem QR
            </Button>
          </div>
        </Space>
      ),
    },
    {
      title: 'Sản phẩm OCOP',
      key: 'product',
      width: 260,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>{record.product?.name}</div>
          <Space size={4} style={{ marginTop: 4 }}>
            <Tag color={record.product?.ocopStarRating === 5 ? 'gold' : 'blue'}>
              <StarFilled /> OCOP {record.product?.ocopStarRating}★
            </Tag>
            <Tag color="green">{record.product?.unit || 'Hộp'}</Tag>
          </Space>
        </div>
      ),
    },
    {
      title: 'Thời gian sản xuất',
      key: 'dates',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div><b>NSX:</b> {dayjs(record.manufactureDate).format('DD/MM/YYYY')}</div>
          <div><b>HSD:</b> {dayjs(record.expiryDate).format('DD/MM/YYYY')}</div>
          <div style={{ color: '#888' }}>Tạo: {dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'Quy mô lô',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (qty, record) => (
        <Text strong style={{ color: '#1b5e20', fontSize: 14 }}>
          {qty.toLocaleString('vi-VN')} {record.product?.unit || 'Hộp'}
        </Text>
      ),
    },
    {
      title: 'Bảo chứng Blockchain',
      key: 'blockchain',
      width: 200,
      render: (_, record) => (
        <div>
          <Tag color="green" icon={<CheckCircleOutlined />} style={{ fontWeight: 'bold' }}>
            {record.blockchainStatus || 'COMMITTED'}
          </Tag>
          <div style={{ marginTop: 4 }}>
            <Tooltip title={record.blockchainTxHash}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#666', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Tx: {record.blockchainTxHash}
              </div>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Button
            type="primary"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleOpenEventsDrawer(record)}
            style={{ background: '#1b5e20' }}
          >
            Nhật ký chuỗi cung ứng
          </Button>
          <Button
            type="default"
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => { setSelectedBatchForQr(record); setQrModalOpen(true); }}
          >
            In tem QR
          </Button>
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
        width={1150}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
            <Space>
              <QrcodeOutlined style={{ color: '#1b5e20', fontSize: 24 }} />
              <div>
                <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
                  Quản Lý Lô Sản Xuất, Nhật Ký Chuỗi Cung Ứng & Mã QR Truy Xuất
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cơ sở: <b>{currentUser?.fullName}</b> — Bảo chứng toàn vẹn bằng SHA-256 & Smart Contract Blockchain
                </Text>
              </div>
            </Space>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                batchForm.resetFields();
                batchForm.setFieldsValue({
                  manufactureDate: dayjs(),
                  expiryDate: dayjs().add(2, 'year'),
                  quantity: 500,
                });
                setCreateBatchOpen(true);
              }}
              style={{ background: '#2e7d32', fontWeight: 'bold' }}
            >
              Tạo lô sản xuất mới
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
          <Text type="secondary">
            Tìm thấy <b>{batches.length}</b> lô sản xuất đã đăng ký tem truy xuất nguồn gốc.
          </Text>
          <Button icon={<SyncOutlined spin={loading} />} onClick={fetchBatches}>
            Làm mới
          </Button>
        </div>

        <Table
          dataSource={batches}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: <Empty description="Chưa có lô sản xuất nào. Hãy nhấn 'Tạo lô sản xuất mới' để phát hành tem QR truy xuất!" /> }}
        />
      </Modal>

      {/* MODAL TẠO LÔ SẢN XUẤT MỚI */}
      <Modal
        open={createBatchOpen}
        onCancel={() => setCreateBatchOpen(false)}
        footer={null}
        width={600}
        centered
        title={
          <Space>
            <QrcodeOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
            <span style={{ fontWeight: 'bold', fontSize: 16, color: '#1b5e20' }}>
              Tạo Lô Sản Xuất Mới & Kích Hoạt Tem QR Blockchain
            </span>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          message="Bảo chứng chuỗi cung ứng minh bạch"
          description="Khi tạo lô, hệ thống sẽ tự động băm toàn bộ dữ liệu thành mã SHA-256 bất biến, ghi nhận lên sổ cái Blockchain và sinh mã QR tra cứu duy nhất cho từng lô hàng."
          style={{ marginBottom: 16 }}
        />

        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleCreateBatch}
        >
          <Form.Item
            name="productId"
            label="Chọn sản phẩm OCOP"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select placeholder="Chọn sản phẩm đã đăng ký">
              {myProducts.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.ocopStarRating} Sao)
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="batchCode"
            label="Mã định danh lô sản xuất (Để trống nếu muốn hệ thống tự sinh mã)"
          >
            <Input placeholder="Ví dụ: BATCH-2026-FINHO-01" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="manufactureDate"
                label="Ngày sản xuất"
                rules={[{ required: true, message: 'Chọn ngày sản xuất' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label="Hạn sử dụng"
                rules={[{ required: true, message: 'Chọn hạn sử dụng' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Số lượng sản phẩm đóng gói trong lô"
            rules={[{ required: true, message: 'Nhập số lượng lô' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} step={100} />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setCreateBatchOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={batchSubmitting}
              style={{ background: '#1b5e20', fontWeight: 'bold' }}
            >
              Khởi Tạo Lô & Phát Hành Tem QR
            </Button>
          </div>
        </Form>
      </Modal>

      {/* DRAWER NHẬT KÝ CHUỖI CUNG ỨNG (SUPPLY CHAIN TIMELINE) */}
      <Drawer
        open={eventsDrawerOpen}
        onClose={() => setEventsDrawerOpen(false)}
        width={680}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <FileTextOutlined style={{ color: '#1b5e20', fontSize: 18 }} />
              <span>Nhật ký chuỗi cung ứng: <b>{activeBatch?.batchCode}</b></span>
            </Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusCircleOutlined />}
              onClick={() => {
                eventForm.resetFields();
                eventForm.setFieldsValue({
                  eventType: 'PROCESSING',
                  actorName: currentUser?.fullName,
                  eventTimestamp: dayjs(),
                });
                setAddEventOpen(true);
              }}
              style={{ background: '#2e7d32' }}
            >
              Ghi nhật ký mới
            </Button>
          </div>
        }
      >
        <div style={{ background: '#f6ffed', padding: 12, borderRadius: 8, marginBottom: 20, border: '1px solid #b7eb8f' }}>
          <div><b>Sản phẩm:</b> {activeBatch?.product?.name}</div>
          <div><b>Số lượng lô:</b> {activeBatch?.quantity} {activeBatch?.product?.unit || 'Hộp'}</div>
          <div><b>Mã băm dữ liệu gốc (SHA-256):</b> <code style={{ fontSize: 11 }}>{activeBatch?.rawDataHash}</code></div>
          <div><b>Mã giao dịch Blockchain:</b> <code style={{ fontSize: 11, color: '#135200' }}>{activeBatch?.blockchainTxHash}</code></div>
        </div>

        {eventsLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : events.length === 0 ? (
          <Empty description="Chưa có nhật ký hoạt động nào cho lô này." />
        ) : (
          <Timeline
            items={events.map((ev, idx) => {
              const badge = getEventTypeBadge(ev.eventType);
              return {
                color: badge.color,
                children: (
                  <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ fontSize: 14 }}>
                        {idx + 1}. {ev.eventName}
                      </Text>
                      <Tag color={badge.color} icon={badge.icon}>
                        {badge.label}
                      </Tag>
                    </div>
                    <Paragraph style={{ margin: '6px 0', fontSize: 13, color: '#555' }}>
                      {ev.description || 'Không có mô tả chi tiết'}
                    </Paragraph>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ fontSize: 11, color: '#777' }}>
                      <div><b>Người thực hiện:</b> {ev.actorName}</div>
                      <div><b>Thời gian:</b> {dayjs(ev.eventTimestamp).format('DD/MM/YYYY HH:mm:ss')}</div>
                      <div><b>Mã băm SHA-256:</b> <code style={{ fontSize: 10 }}>{ev.rawDataHash}</code></div>
                      <div><b>Blockchain Tx:</b> <code style={{ fontSize: 10, color: '#722ed1' }}>{ev.blockchainTxHash}</code></div>
                    </div>
                  </Card>
                ),
              };
            })}
          />
        )}
      </Drawer>

      {/* MODAL GHI THÊM NHẬT KÝ SỰ KIỆN */}
      <Modal
        open={addEventOpen}
        onCancel={() => setAddEventOpen(false)}
        footer={null}
        width={540}
        centered
        title={
          <Space>
            <ToolOutlined style={{ color: '#1b5e20' }} />
            <span>Ghi Nhật Ký Hoạt Động Chuỗi Cung Ứng</span>
          </Space>
        }
      >
        <Form
          form={eventForm}
          layout="vertical"
          onFinish={handleAddEvent}
        >
          <Form.Item
            name="eventType"
            label="Loại hoạt động / Quy trình"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="HARVEST">🌾 1. Thu hái / Khai thác nguyên liệu thô</Option>
              <Option value="PROCESSING">⚙️ 2. Chế biến / Lên men / Sản xuất</Option>
              <Option value="QUALITY_INSPECTION">🔬 3. Kiểm định chất lượng & KCS</Option>
              <Option value="PACKAGING">📦 4. Đóng gói & Dán tem nhãn</Option>
              <Option value="TRANSPORT">🚚 5. Vận chuyển / Xuất kho phân phối</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="eventName"
            label="Tên hoạt động chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động' }]}
          >
            <Input placeholder="Ví dụ: Sao chè bằng chảo gang thủ công ở 90 độ C" />
          </Form.Item>

          <Form.Item
            name="actorName"
            label="Người hoặc Đơn vị chịu trách nhiệm thực hiện"
            rules={[{ required: true, message: 'Nhập tên người thực hiện' }]}
          >
            <Input placeholder="Ví dụ: Nghệ nhân Đặng Văn Nam / Tổ KCS Fìn Hò" />
          </Form.Item>

          <Form.Item
            name="eventTimestamp"
            label="Thời gian thực hiện"
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm:ss" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả kỹ thuật / Nhật ký chi tiết"
          >
            <TextArea rows={3} placeholder="Ghi nhận độ ẩm, nhiệt độ, quy cách kiểm tra..." />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setAddEventOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={eventSubmitting}
              style={{ background: '#1b5e20', fontWeight: 'bold' }}
            >
              Ghi Vào Blockchain Ngay
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL PHÓNG TO / IN TEM QR TRUY XUẤT */}
      <Modal
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalOpen(false)}>Đóng</Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
            style={{ background: '#1b5e20' }}
          >
            In Tem QR
          </Button>
        ]}
        width={420}
        centered
        title="Tem QR Truy Xuất Nguồn Gốc OCOP"
      >
        {selectedBatchForQr && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1b5e20', marginBottom: 4 }}>
              {selectedBatchForQr.product?.name}
            </div>
            <Tag color="gold" style={{ marginBottom: 12 }}>
              Chứng nhận OCOP {selectedBatchForQr.product?.ocopStarRating} Sao
            </Tag>
            <div style={{ padding: 12, background: '#fff', display: 'inline-block', borderRadius: 8, border: '2px dashed #b7eb8f', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img
                src={selectedBatchForQr.qrCodeUrl}
                alt="QR Code"
                style={{ width: 220, height: 220, display: 'block' }}
              />
            </div>
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 'bold' }}>
              Mã Lô: <code>{selectedBatchForQr.batchCode}</code>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              HSD: {dayjs(selectedBatchForQr.expiryDate).format('DD/MM/YYYY')} | SL: {selectedBatchForQr.quantity} {selectedBatchForQr.product?.unit || 'Hộp'}
            </div>
            <div style={{ fontSize: 11, color: '#52c41a', marginTop: 6 }}>
              ✓ Đã bảo chứng bằng mã băm SHA-256 Blockchain
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProducerBatchesModal;
