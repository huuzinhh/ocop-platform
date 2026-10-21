import React, { useState, useEffect } from 'react';
import {
  Modal, Table, Tag, Button, Space, Typography, Card, Row, Col,
  Select, Input, message, Popconfirm, Avatar, Tooltip, Badge, Empty, Switch
} from 'antd';
import {
  UserOutlined, CrownOutlined, ShopOutlined, LockOutlined,
  UnlockOutlined, CheckCircleOutlined, SearchOutlined, ReloadOutlined,
  PhoneOutlined, MailOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import adminApi from '../api/adminApi';
import { useAuth } from '../context/AuthContext';

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function AdminUsersModal({ open, onClose }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, producerCount: 0, customerCount: 0, activeCount: 0, lockedCount: 0 });

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers({ role: roleFilter, status: statusFilter, search: searchQuery }),
        adminApi.getUserStats(),
      ]);

      if (usersRes && usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.data || { totalUsers: 0, adminCount: 0, producerCount: 0, customerCount: 0, activeCount: 0, lockedCount: 0 });
      }
    } catch (err) {
      message.error('Không thể tải danh sách tài khoản người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, roleFilter, statusFilter]);

  const handleSearch = () => {
    fetchData();
  };

  // Toggle Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (record) => {
    const newStatus = record.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      const res = await adminApi.updateUserStatus(record.id, newStatus);
      if (res && res.success) {
        message.success(res.message || `Đã cập nhật trạng thái người dùng thành công`);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái';
      message.error(msg);
    }
  };

  // Xác thực pháp lý cơ sở sản xuất / HTX
  const handleVerifyProducer = async (record, checked) => {
    try {
      const res = await adminApi.verifyProducer(record.producerId, checked);
      if (res && res.success) {
        message.success(checked ? `Đã cấp tích xanh xác thực cho cơ sở "${record.producerName}"` : `Đã hủy xác thực cơ sở "${record.producerName}"`);
        fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi cập nhật xác thực cơ sở';
      message.error(msg);
    }
  };

  const columns = [
    {
      title: 'Tài khoản',
      key: 'user',
      width: 240,
      render: (_, record) => {
        const isSelf = currentUser && currentUser.username === record.username;
        return (
          <Space>
            <Avatar
              size={42}
              src={record.avatarUrl}
              style={{
                backgroundColor: record.roles?.includes('ROLE_ADMIN') ? '#f5222d' : record.roles?.includes('ROLE_PRODUCER') ? '#1890ff' : '#52c41a',
                fontWeight: 'bold',
              }}
            >
              {record.fullName?.charAt(0).toUpperCase() || record.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1b5e20' }}>
                {record.fullName} {isSelf && <Tag color="gold" style={{ fontSize: 10 }}>Bạn</Tag>}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>@{record.username}</div>
              <div style={{ fontSize: 11, color: '#888' }}>
                <MailOutlined style={{ marginRight: 3 }} />
                {record.email}
              </div>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Vai trò',
      key: 'roles',
      width: 140,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.roles?.map((r) => {
            if (r === 'ROLE_ADMIN') {
              return <Tag key={r} color="red" icon={<CrownOutlined />} style={{ fontWeight: 'bold' }}>Quản trị viên</Tag>;
            }
            if (r === 'ROLE_PRODUCER') {
              return <Tag key={r} color="blue" icon={<ShopOutlined />} style={{ fontWeight: 'bold' }}>Nhà sản xuất</Tag>;
            }
            return <Tag key={r} color="green" icon={<UserOutlined />}>Khách hàng</Tag>;
          })}
        </Space>
      ),
    },
    {
      title: 'Cơ sở SX / Hoạt động',
      key: 'activity',
      width: 260,
      render: (_, record) => {
        if (record.producerId) {
          return (
            <div>
              <div style={{ fontWeight: 'bold', color: '#1b5e20', fontSize: 13 }}>
                <ShopOutlined style={{ marginRight: 4 }} />
                {record.producerName}
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>
                Mã: <code>{record.producerCode}</code> | Sản phẩm: <b>{record.productCount}</b> món
              </div>
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Switch
                  size="small"
                  checked={record.isProducerVerified}
                  onChange={(checked) => handleVerifyProducer(record, checked)}
                />
                <Text style={{ fontSize: 11, color: record.isProducerVerified ? '#52c41a' : '#888' }}>
                  {record.isProducerVerified ? '✓ Đã xác thực HTX' : 'Chưa xác thực'}
                </Text>
              </div>
            </div>
          );
        }
        return (
          <div style={{ fontSize: 12, color: '#666' }}>
            <div><PhoneOutlined style={{ marginRight: 4 }} /> SĐT: {record.phone || 'Chưa cập nhật'}</div>
            <div>Đơn đã đặt: <b>{record.orderCount || 0}</b> đơn</div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_, record) => (
        record.status === 'LOCKED' ? (
          <Tag color="error" icon={<LockOutlined />} style={{ fontWeight: 'bold' }}>
            ĐÃ BỊ KHÓA
          </Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 'bold' }}>
            HOẠT ĐỘNG
          </Tag>
        )
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (d) => <span style={{ fontSize: 12 }}>{d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (_, record) => {
        const isSelf = currentUser && currentUser.username === record.username;
        const isRootAdmin = record.id === 1;

        if (isSelf || isRootAdmin) {
          return <Text type="secondary" style={{ fontSize: 11 }}>Không thể khóa</Text>;
        }

        const isLocked = record.status === 'LOCKED';
        return (
          <Popconfirm
            title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản người dùng'}
            description={
              isLocked
                ? `Cho phép tài khoản ${record.username} đăng nhập lại hệ thống?`
                : `Người dùng ${record.username} sẽ bị chặn đăng nhập ngay lập tức?`
            }
            onConfirm={() => handleToggleStatus(record)}
            okText={isLocked ? 'Mở khóa' : 'Khóa ngay'}
            cancelText="Hủy"
            okButtonProps={isLocked ? { style: { background: '#52c41a' } } : { danger: true }}
          >
            <Button
              size="small"
              type={isLocked ? 'primary' : 'default'}
              danger={!isLocked}
              icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
              style={isLocked ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
            >
              {isLocked ? 'Mở khóa' : 'Khóa'}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1150}
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
          <UserOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 'bold', color: '#1b5e20' }}>
              Quản Lý Người Dùng & Cơ Sở Sản Xuất OCOP
            </div>
            <div style={{ fontSize: 12, color: '#666', fontWeight: 'normal' }}>
              Kiểm soát tài khoản, phân quyền, phê duyệt tích xanh HTX và bảo mật hệ thống
            </div>
          </div>
        </div>
      }
      styles={{ body: { padding: '16px 24px' } }}
    >
      {/* 4 THẺ THỐNG KÊ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Tổng Tài Khoản</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#096dd9' }}>
              {stats.totalUsers}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Cơ Sở Sản Xuất / HTX</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#389e0d' }}>
              {stats.producerCount}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: '#f9f0ff', border: '1px solid #d3adf7' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Khách Hàng</Text>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#722ed1' }}>
              {stats.customerCount}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 8, background: '#fff1f0', border: '1px solid #ffa39e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Tài Khoản Bị Khóa</Text>
              {stats.lockedCount > 0 && <Badge count={stats.lockedCount} />}
            </div>
            <Title level={3} style={{ margin: '4px 0 0 0', color: '#cf1322' }}>
              {stats.lockedCount}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* THANH BỘ LỌC VÀ TÌM KIẾM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Select
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            style={{ width: 170 }}
          >
            <Option value="ALL">Tất cả vai trò</Option>
            <Option value="PRODUCER">Nhà sản xuất ({stats.producerCount})</Option>
            <Option value="CUSTOMER">Khách hàng ({stats.customerCount})</Option>
            <Option value="ADMIN">Quản trị viên ({stats.adminCount})</Option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ width: 160 }}
          >
            <Option value="ALL">Tất cả trạng thái</Option>
            <Option value="ACTIVE">Hoạt động ({stats.activeCount})</Option>
            <Option value="LOCKED">Bị khóa ({stats.lockedCount})</Option>
          </Select>

          <Search
            placeholder="Tìm theo tên, username, email, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 260 }}
            allowClear
            prefix={<SearchOutlined />}
          />
        </Space>

        <Text type="secondary" style={{ fontSize: 12 }}>
          Hiển thị <b>{users.length}</b> tài khoản
        </Text>
      </div>

      {/* BẢNG NGƯỜI DÙNG */}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 7, showTotal: (t) => `Tổng cộng ${t} người dùng` }}
        size="middle"
        locale={{ emptyText: <Empty description="Không tìm thấy người dùng phù hợp" /> }}
      />
    </Modal>
  );
}
