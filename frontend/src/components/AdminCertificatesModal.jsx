import React, { useState, useEffect } from 'react';
import {
  Modal, Table, Tag, Button, Space, Typography, Card, Row, Col,
  Radio, message, Popconfirm, Input, Form, Tooltip, Badge, Image, Divider, Empty
} from 'antd';
import {
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, EyeOutlined, FilePdfOutlined, StarFilled,
  ExclamationCircleOutlined, ReloadOutlined, ShopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import adminApi from '../api/adminApi';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function AdminCertificatesModal({ open, onClose, onCertUpdated }) {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, expired: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCertForReject, setSelectedCertForReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCertDetail, setSelectedCertDetail] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminApi.getCertificates(statusFilter),
        adminApi.getCertificateStats(),
      ]);

      if (listRes && listRes.success) {
        setCertificates(listRes.data || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.data || { total: 0, pending: 0, approved: 0, rejected: 0, expired: 0 });
      }
    } catch (err) {
      message.error('Không thể tải danh sách hồ sơ chứng nhận OCOP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, statusFilter]);

  // Handle Approve Certificate
  const handleApprove = async (record) => {
    try {
      const res = await adminApi.auditCertificate(record.certificateId, 'APPROVE');
      if (res && res.success) {
        message.success(`Đã phê duyệt chứng nhận ${record.certificateCode} cho "${record.productName}"!`);
        fetchData();
        if (onCertUpdated) onCertUpdated();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi phê duyệt hồ sơ';
      message.error(msg);
    }
  };

  // Open Reject Modal
  const handleOpenReject = (record) => {
    setSelectedCertForReject(record);
    setRejectReason('Mã quyết định không khớp với dữ liệu cổng OCOP Quốc gia');
    setRejectModalOpen(true);
  };

  // Submit Reject Certificate
  const handleSubmitReject = async () => {
    if (!rejectReason || !rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối để thông báo cho Nhà sản xuất');
      return;
    }
    setRejecting(true);
    try {
      const res = await adminApi.auditCertificate(selectedCertForReject.certificateId, 'REJECT', rejectReason.trim());
      if (res && res.success) {
        message.warning(`Đã từ chối hồ sơ chứng nhận ${selectedCertForReject.certificateCode}`);
        setRejectModalOpen(false);
        fetchData();
        if (onCertUpdated) onCertUpdated();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi từ chối hồ sơ';
      message.error(msg);
    } finally {
      setRejecting(false);
    }
  };

  const getStatusBadge = (status, rejectionReason) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 'bold' }}>
            Đã Thẩm Định OCOP
          </Tag>
        );
      case 'PENDING':
        return (
          <Tag color="warning" icon={<ClockCircleOutlined />} style={{ fontWeight: 'bold' }}>
            Chờ Thẩm Định
          </Tag>
        );
      case 'REJECTED':
        return (
          <Tooltip title={`Lý do: ${rejectionReason || 'Không đạt chuẩn'}`}>
            <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontWeight: 'bold', cursor: 'pointer' }}>
              Bị Từ Chối
            </Tag>
          </Tooltip>
        );
      case 'EXPIRED':
        return (
          <Tag color="default" icon={<ExclamationCircleOutlined />} style={{ fontWeight: 'bold' }}>
            Đã Hết Hạn
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Sản phẩm OCOP',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <Space orientation="horizontal" align="start">
          <Image
            src={record.productThumbnail || 'https://placehold.co/100x100?text=OCOP'}
            width={52}
            height={52}
            style={{ borderRadius: 6, objectFit: 'cover' }}
            fallback="https://placehold.co/100x100?text=OCOP"
          />
          <div>
            <Text strong style={{ color: '#1b5e20', fontSize: 13, display: 'block' }}>
              {record.productName || 'Sản phẩm #' + record.productId}
            </Text>
            <Space size={4} style={{ marginTop: 2 }}>
              <Tag color={record.starRating === 5 ? 'gold' : 'blue'}>
                <StarFilled /> OCOP {record.starRating}★
              </Tag>
              {record.productPrice && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {Number(record.productPrice).toLocaleString('vi-VN')} đ
                </Text>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Cơ sở sản xuất',
      key: 'producer',
      width: 190,
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 12 }}>
            <ShopOutlined style={{ marginRight: 4, color: '#1b5e20' }} />
            {record.producerName || 'Chưa định danh'}
          </Text>
          {record.producerProvince && (
            <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
              Tỉnh/TP: <b>{record.producerProvince}</b>
            </div>
          )}
          {record.producerCode && (
            <Tag style={{ fontSize: 10, marginTop: 4 }}>{record.producerCode}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Hồ sơ Chứng nhận OCOP',
      key: 'certInfo',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1b5e20', fontSize: 13 }}>
            <SafetyCertificateOutlined style={{ marginRight: 4 }} />
            {record.certificateCode}
          </div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
            <b>Cơ quan cấp:</b> {record.issuingAuthority}
          </div>
          <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>
            Ngày cấp: {record.issuedDate ? dayjs(record.issuedDate).format('DD/MM/YYYY') : '—'} | HSD: {record.expiryDate ? dayjs(record.expiryDate).format('DD/MM/YYYY') : '—'}
          </div>
          {record.documentUrl && (
            <div style={{ marginTop: 4 }}>
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined />}
                href={record.documentUrl}
                target="_blank"
                style={{ padding: 0, fontSize: 11, color: '#1890ff' }}
              >
                Xem quyết định / Hồ sơ scan
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái Thẩm định',
      key: 'status',
      width: 170,
      render: (_, record) => (
        <div>
          <div>{getStatusBadge(record.status, record.rejectionReason)}</div>
          {record.verifiedAt && (
            <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
              Duyệt bởi: <b>{record.verifiedBy}</b>
              <br />
              Lúc: {dayjs(record.verifiedAt).format('DD/MM/YYYY HH:mm')}
            </div>
          )}
          {record.status === 'REJECTED' && record.rejectionReason && (
            <div style={{ fontSize: 11, color: '#cf1322', marginTop: 4, background: '#fff1f0', padding: '2px 6px', borderRadius: 4 }}>
              Lý do: {record.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao tác Thẩm định',
      key: 'actions',
      width: 190,
      render: (_, record) => (
        <Space size={6} wrap>
          {record.status !== 'APPROVED' && (
            <Popconfirm
              title="Phê duyệt chứng nhận OCOP"
              description={`Xác nhận hồ sơ ${record.certificateCode} hợp lệ và cấp Tích xanh OCOP cho sản phẩm?`}
              onConfirm={() => handleApprove(record)}
              okText="Phê duyệt"
              cancelText="Hủy"
              okButtonProps={{ style: { background: '#52c41a' } }}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 'bold' }}
              >
                Duyệt
              </Button>
            </Popconfirm>
          )}

          {record.status !== 'REJECTED' && (
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleOpenReject(record)}
            >
              Từ chối
            </Button>
          )}

          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCertDetail(record);
              setDetailModalOpen(true);
            }}
          >
            Chi tiết
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
        width={1180}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Làm mới
          </Button>,
          <Button key="close" type="primary" onClick={onClose} style={{ background: '#1b5e20' }}>
            Đóng
          </Button>,
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 'bold', color: '#1b5e20' }}>
                Hội Đồng Thẩm Định & Phê Duyệt Chứng Nhận OCOP
              </div>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
                Cơ chế đối soát tính minh bạch, tính pháp lý của chứng nhận OCOP 3★ – 5★ trước khi gắn nhãn chính thức
              </div>
            </div>
          </div>
        }
        styles={{ body: { padding: '16px 24px' } }}
      >
        {/* THỐNG KÊ NHANH 4 THẺ */}
        <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tổng Hồ Sơ</Text>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#1b5e20' }}>
                {stats.total}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              style={{
                borderRadius: 8,
                background: stats.pending > 0 ? '#fffbe6' : '#fafafa',
                border: stats.pending > 0 ? '1px solid #ffe58f' : '1px solid #d9d9d9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Chờ Thẩm Định</Text>
                {stats.pending > 0 && <Badge count={stats.pending} style={{ backgroundColor: '#fa8c16' }} />}
              </div>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#fa8c16' }}>
                {stats.pending}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Đã Cấp Tích Xanh</Text>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                {stats.approved}
              </Title>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8, background: '#fff1f0', border: '1px solid #ffa39e' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Bị Từ Chối / Hết Hạn</Text>
              <Title level={3} style={{ margin: '4px 0 0 0', color: '#cf1322' }}>
                {stats.rejected + stats.expired}
              </Title>
            </Card>
          </Col>
        </Row>

        {/* BỘ LỌC TRẠNG THÁI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Radio.Group
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="ALL">Tất cả ({stats.total})</Radio.Button>
            <Radio.Button value="PENDING">
              <Badge count={stats.pending} size="small" offset={[6, -2]}>
                Chờ duyệt
              </Badge>
            </Radio.Button>
            <Radio.Button value="APPROVED">Đã phê duyệt ({stats.approved})</Radio.Button>
            <Radio.Button value="REJECTED">Từ chối ({stats.rejected})</Radio.Button>
            <Radio.Button value="EXPIRED">Đã hết hạn ({stats.expired})</Radio.Button>
          </Radio.Group>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Hiển thị <b>{certificates.length}</b> hồ sơ
          </Text>
        </div>

        {/* BẢNG HỒ SƠ CHỨNG NHẬN */}
        <Table
          columns={columns}
          dataSource={certificates}
          rowKey="certificateId"
          loading={loading}
          pagination={{ pageSize: 6, showTotal: (total) => `Tổng cộng ${total} hồ sơ` }}
          size="middle"
          locale={{ emptyText: <Empty description="Không có hồ sơ chứng nhận nào phù hợp" /> }}
        />
      </Modal>

      {/* MODAL TỪ CHỐI HỒ SƠ */}
      <Modal
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        title={
          <div style={{ color: '#cf1322', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloseCircleOutlined />
            <span>Từ chối Hồ Sơ Chứng Nhận OCOP</span>
          </div>
        }
        footer={[
          <Button key="cancel" onClick={() => setRejectModalOpen(false)}>Hủy</Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={rejecting}
            onClick={handleSubmitReject}
          >
            Xác nhận Từ Chối
          </Button>,
        ]}
      >
        {selectedCertForReject && (
          <div style={{ padding: '8px 0' }}>
            <Paragraph>
              Bạn đang thực hiện từ chối hồ sơ mã <b>{selectedCertForReject.certificateCode}</b> của sản phẩm{' '}
              <b>"{selectedCertForReject.productName}"</b> (Cơ sở: {selectedCertForReject.producerName}).
            </Paragraph>
            <Text strong>Lý do từ chối (Nhà sản xuất sẽ nhận được thông báo này):</Text>
            <TextArea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Giấy chứng nhận scan bị mờ; Mã số quyết định không tìm thấy trên Cổng OCOP Quốc gia; Xếp hạng sao không khớp..."
              style={{ marginTop: 8 }}
            />
          </div>
        )}
      </Modal>

      {/* MODAL CHI TIẾT ĐỐI CHIẾU HỒ SƠ */}
      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={<Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>}
        title="Đối Chiếu Chi Tiết Hồ Sơ OCOP"
        width={600}
      >
        {selectedCertDetail && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <Image
                src={selectedCertDetail.productThumbnail}
                width={80}
                height={80}
                style={{ borderRadius: 8, objectFit: 'cover' }}
              />
              <div>
                <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
                  {selectedCertDetail.productName}
                </Title>
                <Tag color={selectedCertDetail.starRating === 5 ? 'gold' : 'blue'} style={{ marginTop: 4 }}>
                  <StarFilled /> OCOP {selectedCertDetail.starRating} Sao
                </Tag>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Thuộc cơ sở: <b>{selectedCertDetail.producerName}</b> ({selectedCertDetail.producerProvince})
                </div>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Text type="secondary">Mã Số Chứng Nhận:</Text>
                <div style={{ fontWeight: 'bold' }}>{selectedCertDetail.certificateCode}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Cơ Quan Cấp Quyết Định:</Text>
                <div style={{ fontWeight: 'bold' }}>{selectedCertDetail.issuingAuthority}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Ngày Cấp:</Text>
                <div>{selectedCertDetail.issuedDate ? dayjs(selectedCertDetail.issuedDate).format('DD/MM/YYYY') : '—'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Hạn Sử Dụng Chứng Nhận:</Text>
                <div>{selectedCertDetail.expiryDate ? dayjs(selectedCertDetail.expiryDate).format('DD/MM/YYYY') : '—'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Trạng Thái Thẩm Định:</Text>
                <div style={{ marginTop: 2 }}>{getStatusBadge(selectedCertDetail.status, selectedCertDetail.rejectionReason)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Chuyên Viên Thẩm Định:</Text>
                <div style={{ fontWeight: 'bold' }}>{selectedCertDetail.verifiedBy || 'Chưa thẩm định'}</div>
              </Col>
            </Row>

            {selectedCertDetail.rejectionReason && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff1f0', borderRadius: 6, border: '1px solid #ffa39e' }}>
                <Text strong style={{ color: '#cf1322' }}>Lý do từ chối:</Text>
                <div style={{ color: '#cf1322', marginTop: 4 }}>{selectedCertDetail.rejectionReason}</div>
              </div>
            )}

            {selectedCertDetail.documentUrl && (
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  href={selectedCertDetail.documentUrl}
                  target="_blank"
                  style={{ background: '#1890ff' }}
                  block
                >
                  Xem Quyết Định / Hồ Sơ Scan Gốc
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
