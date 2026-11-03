import React, { useState, useRef, useEffect } from 'react';
import {
  Button, Input, Avatar, Typography, Space, Tooltip, Tag, Spin
} from 'antd';
import {
  RobotOutlined, SendOutlined, CloseOutlined,
  ClearOutlined, UserOutlined, EyeOutlined,
  StarFilled, EnvironmentOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

// Mặc định gọi vào Webhook của n8n
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/ocop-ai-agent';

const QUICK_PROMPTS = [
  '🌟 Gợi ý đặc sản 5 sao',
  '🍵 Kể câu chuyện Chè Shan Tuyết',
  '📦 Kiểm tra đơn hàng của tôi',
  '🍯 Mật ong bạc hà Mèo Vạc có gì đặc biệt?'
];

// Hàm bóc tách nội dung văn bản (hỗ trợ in đậm **...** và link [Tiêu đề](product:ID))
const renderRichText = (text, onViewProduct) => {
  if (!text) return null;

  // Tách link dạng [Tên sản phẩm](product:123)
  const linkRegex = /\[(.*?)\]\(product:(\d+)\)/g;
  const segments = [];
  let lastIdx = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      segments.push(text.substring(lastIdx, match.index));
    }
    const title = match[1];
    const pid = Number(match[2]);
    segments.push(
      <Button
        key={`link-${match.index}`}
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => onViewProduct && onViewProduct(pid)}
        style={{
          padding: '0 4px',
          height: 'auto',
          fontWeight: 'bold',
          color: '#1b5e20',
          textDecoration: 'underline'
        }}
      >
        {title}
      </Button>
    );
    lastIdx = linkRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    segments.push(text.substring(lastIdx));
  }

  // Xử lý in đậm **bold** trong từng segment chuỗi
  return segments.map((seg, i) => {
    if (typeof seg !== 'string') return seg;

    const boldParts = seg.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={`b-${i}-${j}`}>{bPart.slice(2, -2)}</strong>;
      }
      return bPart;
    });
  });
};

// Render card sản phẩm OCOP tương tác
const renderProductCard = (prod, key, onViewProduct) => {
  const prodId = Number(prod.id);
  const formattedPrice =
    typeof prod.price === 'number'
      ? prod.price.toLocaleString('vi-VN') + ' đ'
      : (prod.price || '').toString().includes('đ')
      ? prod.price
      : Number(prod.price)
      ? Number(prod.price).toLocaleString('vi-VN') + ' đ'
      : prod.price;

  return (
    <div
      key={`prod-${key}-${prod.id}`}
      style={{
        margin: '10px 0',
        padding: '10px 12px',
        background: '#ffffff',
        borderRadius: 12,
        border: '1.5px solid #b7eb8f',
        boxShadow: '0 3px 10px rgba(27,94,32,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1b5e20', lineHeight: 1.3 }}>
          {prod.name}
        </div>
        {prod.star && (
          <Tag color="gold" icon={<StarFilled />} style={{ fontSize: 11, margin: 0, padding: '0 5px', fontWeight: 'bold' }}>
            {prod.star}★
          </Tag>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {prod.province && (
            <Tag color="cyan" icon={<EnvironmentOutlined />} style={{ fontSize: 10, margin: 0 }}>
              {prod.province}
            </Tag>
          )}
          <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 13 }}>
            {formattedPrice}
            {prod.unit ? ` / ${prod.unit}` : ''}
          </span>
        </div>

        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onViewProduct && onViewProduct(prodId)}
          style={{
            background: '#1b5e20',
            borderColor: '#1b5e20',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 'bold',
            height: 26,
            padding: '0 10px'
          }}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
};

// Hàm phân tách và render toàn bộ nội dung tin nhắn bot
const renderBotMessage = (text, onViewProduct) => {
  if (!text) return null;

  // Regex nhận diện cấu trúc [PRODUCT_CARD:{...}] hoặc [PRODUCT:id=1|...]
  const pattern = /(\[PRODUCT_CARD:\{[\s\S]*?\}\]|\[PRODUCT:id=\d+[\s\S]*?\])/g;
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Trường hợp là [PRODUCT_CARD:{...}]
    if (part.startsWith('[PRODUCT_CARD:') && part.endsWith(']')) {
      try {
        const jsonStr = part.slice(14, -1).trim();
        const prod = JSON.parse(jsonStr);
        return renderProductCard(prod, index, onViewProduct);
      } catch (err) {
        console.warn('Lỗi parse PRODUCT_CARD:', err);
      }
    }

    // 2. Trường hợp là [PRODUCT:id=1|name=...|price=...]
    if (part.startsWith('[PRODUCT:id=') && part.endsWith(']')) {
      try {
        const inner = part.slice(9, -1).trim();
        const prod = {};
        inner.split('|').forEach((pair) => {
          const [key, ...vals] = pair.split('=');
          if (key) prod[key.trim()] = vals.join('=').trim();
        });
        if (prod.id) {
          return renderProductCard(prod, index, onViewProduct);
        }
      } catch (err) {
        console.warn('Lỗi parse PRODUCT tag:', err);
      }
    }

    // 3. Văn bản thông thường
    return (
      <span key={`text-${index}`}>
        {renderRichText(part, onViewProduct)}
      </span>
    );
  });
};

const ChatBotWidget = ({ onViewProduct }) => {
  const { currentUser, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI của Sàn OCOP Việt Nam. Tôi có thể giúp bạn khám phá đặc sản vùng miền, tìm hiểu câu chuyện làng nghề hoặc tra cứu đơn hàng cá nhân. Bạn cần hỗ trợ gì hôm nay?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    // Lấy Token JWT nếu người dùng đã đăng nhập
    const token = localStorage.getItem('ocop_token') || '';
    const sessionId = currentUser?.id ? `user_${currentUser.id}` : 'guest_session';

    try {
      const response = await axios.post(
        N8N_WEBHOOK_URL,
        {
          message: text,
          jwtToken: token,
          sessionId: sessionId,
          userFullName: currentUser?.fullName || 'Khách'
        },
        {
          timeout: 25000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      let botReply = '';
      if (typeof response.data === 'string') {
        botReply = response.data;
      } else if (response.data?.reply) {
        botReply = response.data.reply;
      } else if (response.data?.output) {
        botReply = response.data.output;
      } else {
        botReply = JSON.stringify(response.data);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Lỗi kết nối n8n AI:', err);
      let errorHelp = 'Không thể kết nối đến Trợ lý AI (n8n Webhook).';
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorHelp += '\n\n💡 Vui lòng đảm bảo container n8n đang chạy và webhook đã được kích hoạt tại: ' + N8N_WEBHOOK_URL;
      } else if (err.response?.status === 404) {
        errorHelp += '\n\n💡 Webhook chưa được kích hoạt hoặc URL không đúng.';
      } else {
        errorHelp += `\n(${err.message || 'Lỗi không xác định'})`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          isError: true,
          text: errorHelp,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'bot',
        text: 'Lịch sử trò chuyện đã được làm mới. Tôi có thể giúp gì tiếp theo cho bạn?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1050 }}>
      {/* KHUNG CỬA SỔ CHAT */}
      {isOpen && (
        <div
          style={{
            width: 400,
            maxWidth: '92vw',
            height: 540,
            maxHeight: '82vh',
            background: '#ffffff',
            borderRadius: 16,
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 16,
            border: '1px solid #d9d9d9'
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Space>
              <Avatar
                size={38}
                icon={<RobotOutlined />}
                style={{ background: '#ffd54f', color: '#1b5e20' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Trợ lý AI OCOP
                  <Tag color="gold" style={{ fontSize: 10, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                    Gemini RAG
                  </Tag>
                </div>
                <div style={{ fontSize: 11, color: '#c8e6c9', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }} />
                  {isLoggedIn ? `Sẵn sàng (${currentUser?.fullName})` : 'Sẵn sàng (Khách)'}
                </div>
              </div>
            </Space>

            <Space>
              <Tooltip title="Xóa lịch sử chat">
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined style={{ color: '#fff' }} />}
                  onClick={handleClearHistory}
                />
              </Tooltip>
              <Tooltip title="Đóng cửa sổ">
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined style={{ color: '#fff' }} />}
                  onClick={() => setIsOpen(false)}
                />
              </Tooltip>
            </Space>
          </div>

          {/* DANH SÁCH TIN NHẮN */}
          <div
            style={{
              flex: 1,
              padding: '14px 14px',
              overflowY: 'auto',
              background: '#f8faf7',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8,
                  alignItems: 'flex-start'
                }}
              >
                {msg.sender === 'bot' && (
                  <Avatar
                    size={28}
                    icon={<RobotOutlined />}
                    style={{ background: '#1b5e20', color: '#ffd54f', flexShrink: 0 }}
                  />
                )}

                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: msg.sender === 'user' ? '#1b5e20' : msg.isError ? '#fff1f0' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : msg.isError ? '#cf1322' : '#262626',
                    border: msg.sender === 'user' ? 'none' : msg.isError ? '1px solid #ffa39e' : '1px solid #e8e8e8',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}
                >
                  {msg.sender === 'bot'
                    ? renderBotMessage(msg.text, onViewProduct)
                    : msg.text}
                  <div
                    style={{
                      fontSize: 10,
                      marginTop: 4,
                      textAlign: 'right',
                      opacity: 0.7,
                      color: msg.sender === 'user' ? '#d9f7be' : '#8c8c8c'
                    }}
                  >
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <Avatar
                    size={28}
                    icon={<UserOutlined />}
                    style={{ background: '#ffd54f', color: '#1b5e20', flexShrink: 0 }}
                  />
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar
                  size={28}
                  icon={<RobotOutlined />}
                  style={{ background: '#1b5e20', color: '#ffd54f' }}
                />
                <div
                  style={{
                    padding: '8px 14px',
                    background: '#ffffff',
                    borderRadius: 14,
                    border: '1px solid #e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#555'
                  }}
                >
                  <Spin size="small" /> Đang tra cứu thông tin OCOP...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* GỢI Ý CÂU HỎI NHANH */}
          <div
            style={{
              padding: '6px 12px',
              background: '#f0f5ed',
              borderTop: '1px solid #e4ede0',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: 6
            }}
          >
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Button
                key={idx}
                size="small"
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  fontSize: 11,
                  borderRadius: 12,
                  borderColor: '#b7eb8f',
                  color: '#237804',
                  background: '#ffffff'
                }}
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* Ô NHẬP TIN NHẮN */}
          <div
            style={{
              padding: '10px 12px',
              background: '#ffffff',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              gap: 8
            }}
          >
            <Input.TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi về đặc sản, câu chuyện OCOP, đơn hàng..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ borderRadius: 10, fontSize: 13 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend()}
              loading={loading}
              style={{
                background: '#1b5e20',
                borderColor: '#1b5e20',
                borderRadius: 10,
                height: 'auto',
                alignSelf: 'flex-end'
              }}
            />
          </div>
        </div>
      )}

      {/* NÚT BẤM MỞ CHATBOT (FLOATING ACTION BUTTON) */}
      <Tooltip title={isOpen ? 'Thu nhỏ Chatbot' : 'Hỏi Trợ lý AI OCOP'} placement="left">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={
            isOpen ? (
              <CloseOutlined style={{ fontSize: 20 }} />
            ) : (
              <RobotOutlined style={{ fontSize: 26, color: '#ffd54f' }} />
            )
          }
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
            border: '2px solid #ffd54f',
            boxShadow: '0 6px 20px rgba(27,94,32,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      </Tooltip>
    </div>
  );
};

export default ChatBotWidget;
