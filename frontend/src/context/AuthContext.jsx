import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục trạng thái đăng nhập từ localStorage khi ứng dụng khởi động
  useEffect(() => {
    const savedUser = localStorage.getItem('ocop_user');
    const savedToken = localStorage.getItem('ocop_token');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ocop_user');
        localStorage.removeItem('ocop_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail, password) => {
    const res = await authApi.login({ usernameOrEmail, password });
    if (res.success && res.data) {
      const { accessToken, user } = res.data;
      localStorage.setItem('ocop_token', accessToken);
      localStorage.setItem('ocop_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    }
    throw new Error(res.message || 'Đăng nhập thất bại');
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.message || 'Đăng ký thất bại');
  };

  const logout = () => {
    localStorage.removeItem('ocop_token');
    localStorage.removeItem('ocop_user');
    setCurrentUser(null);
  };

  // Kiểm tra quyền hạn của người dùng hiện tại
  const hasRole = (role) => {
    if (!currentUser?.roles) return false;
    return currentUser.roles.includes(role);
  };

  const isAdmin = () => hasRole('ROLE_ADMIN');
  const isProducer = () => hasRole('ROLE_PRODUCER');
  const isCustomer = () => hasRole('ROLE_CUSTOMER');

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isProducer,
    isCustomer,
    isLoggedIn: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
