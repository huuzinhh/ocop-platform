import React, { useState } from 'react';
import {
  Modal, Tabs, Form, Input, Button, Select, Alert, Typography, Space, Tag
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  SafetyCertificateOutlined, ShopOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Text, Title } = Typography;
const { Option } = Select;

const AuthModal = ({ open, onClose }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleClose = () => {
    loginForm.resetFields();
    registerForm.resetFields();
    setErrorMsg('');
    setSuccessMsg('');
    setActiveTab('login');
    onClose();
  };

  const handleLogin = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(values.usernameOrEmail, values.password);
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        role: values.role,
      });
      setSuccessMsg('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      registerForm.resetFields();
      setTimeout(() => setActiveTab('login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginTab = (
    <Form form={loginForm} onFinish={handleLogin} layout="vertical" size="large">
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon closable
          onClose={() => setErrorMsg('')} style={{ marginBottom: 16 }} />
      )}
      <Form.Item name="usernameOrEmail"
        rules={[{ required: true, message: 'Nhập username hoặc email' }]}>
        <Input prefix={<UserOutlined />} placeholder="Username hoặc Email" />
      </Form.Item>
      <Form.Item name="password"
        rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
      </Form.Item>

      <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6ffed',
        borderRadius: 6, border: '1px dashed #b7eb8f', fontSize: 12 }}>
        <Text type="secondary"><b>Tài khoản thử nghiệm:</b></Text>
        <div><Tag color="red">Admin</Tag> admin / 123456</div>
        <div><Tag color="blue">Nhà SX</Tag> producer_finho / 123456</div>
        <div><Tag color="green">Khách hàng</Tag> customer_demo / 123456</div>
      </div>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}
          style={{ background: '#1b5e20', height: 44 }}>
          Đăng nhập
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">Chưa có tài khoản? </Text>
        <Button type="link" onClick={() => { setErrorMsg(''); setActiveTab('register'); }}>
          Đăng ký ngay
        </Button>
      </div>
    </Form>
  );

  const registerTab = (
    <Form form={registerForm} onFinish={handleRegister} layout="vertical" size="large">
      {errorMsg && (
        <Alert message={errorMsg} type="error" showIcon closable
          onClose={() => setErrorMsg('')} style={{ marginBottom: 16 }} />
      )}
      {successMsg && (
        <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16 }} />
      )}
      <Form.Item name="fullName"
        rules={[{ required: true, message: 'Nhập họ và tên' }]}>
        <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
      </Form.Item>
      <Form.Item name="username"
        rules={[
          { required: true, message: 'Nhập tên đăng nhập' },
          { min: 3, message: 'Tối thiểu 3 ký tự' }
        ]}>
        <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập (username)" />
      </Form.Item>
      <Form.Item name="email"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' }
        ]}>
        <Input prefix={<MailOutlined />} placeholder="Địa chỉ email" />
      </Form.Item>
      <Form.Item name="password"
        rules={[
          { required: true, message: 'Nhập mật khẩu' },
          { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
        ]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu (tối thiểu 6 ký tự)" />
      </Form.Item>
      <Form.Item name="phone">
        <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại (tuỳ chọn)" />
      </Form.Item>
      <Form.Item name="role" initialValue="CUSTOMER"
        rules={[{ required: true, message: 'Chọn loại tài khoản' }]}>
        <Select placeholder="Loại tài khoản">
          <Option value="CUSTOMER">
            <Space><UserOutlined />Khách hàng — Mua sắm đặc sản OCOP</Space>
          </Option>
          <Option value="PRODUCER">
            <Space><ShopOutlined />Nhà sản xuất / Hợp tác xã — Đăng bán sản phẩm</Space>
          </Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}
          style={{ background: '#1b5e20', height: 44 }}>
          Đăng ký tài khoản
        </Button>
      </Form.Item>
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary">Đã có tài khoản? </Text>
        <Button type="link" onClick={() => { setErrorMsg(''); setActiveTab('login'); }}>
          Đăng nhập
        </Button>
      </div>
    </Form>
  );

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={440}
      centered
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#1b5e20', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#1b5e20' }}>
            OCOP Việt Nam
          </Title>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(k) => { setErrorMsg(''); setSuccessMsg(''); setActiveTab(k); }}
        centered
        items={[
          { key: 'login', label: 'Đăng nhập', children: loginTab },
          { key: 'register', label: 'Đăng ký', children: registerTab },
        ]}
      />
    </Modal>
  );
};

export default AuthModal;
