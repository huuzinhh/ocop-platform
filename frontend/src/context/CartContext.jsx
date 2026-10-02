import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '../api/cartApi';
import { useAuth } from './AuthContext';
import { message } from 'antd';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isLoggedIn) {
      setCart({ items: [], totalItems: 0, totalAmount: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await cartApi.getCart();
      if (res && res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Không thể tải giỏ hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isLoggedIn) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return false;
    }
    try {
      const res = await cartApi.addToCart(productId, quantity);
      if (res && res.success && res.data) {
        setCart(res.data);
        message.success('Đã thêm sản phẩm OCOP vào giỏ hàng!');
        return true;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi thêm vào giỏ hàng';
      message.error(msg);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await cartApi.updateQuantity(itemId, quantity);
      if (res && res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Không thể cập nhật số lượng');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await cartApi.removeItem(itemId);
      if (res && res.success && res.data) {
        setCart(res.data);
        message.success('Đã xóa món khỏi giỏ hàng');
      }
    } catch (err) {
      message.error('Lỗi khi xóa món khỏi giỏ');
    }
  };

  const clearCart = async () => {
    try {
      const res = await cartApi.clearCart();
      if (res && res.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        cartCount: cart.totalItems || 0,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
