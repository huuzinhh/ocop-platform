# HƯỚNG DẪN KIỂM THỬ HỆ THỐNG (TESTING GUIDE)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Mã tài liệu**: TEST-OCOP-01  

---

## 1. Chiến lược Kiểm thử (Testing Strategy)

Hệ thống được kiểm thử theo 3 cấp độ:
1. **Unit Testing**:
   - Backend: JUnit 5 & Mockito kiểm tra các logic tính toán mã băm SHA-256, chuyển trạng thái đơn hàng.
   - Blockchain: Hardhat/Chai kiểm tra các hàm trong Smart Contract (`registerBatch`, `verifyHash`).
2. **Integration Testing**:
   - Kiểm tra kết nối Spring Boot ↔ PostgreSQL.
   - Kiểm tra tương tác giữa Backend và Hardhat JSON-RPC.
3. **End-to-End (E2E) & User Journey Testing**:
   - Luồng Khách hàng: Tìm sản phẩm -> Xem bản đồ GIS -> Đặt hàng -> Quét mã QR xác minh chuỗi cung ứng.
   - Luồng Nhà sản xuất: Đăng sản phẩm -> Tạo lô -> Ghi nhật ký -> Nhận tem QR.

---

## 2. Hướng dẫn Chạy Kiểm thử Cụ thể

### 2.1. Kiểm thử Backend (Spring Boot)
Chạy lệnh kiểm thử toàn bộ test suites:
```powershell
cd "D:\Đồ án tốt nghiệp\backend"
.\mvnw test
```

### 2.2. Kiểm thử Smart Contract (Hardhat)
```powershell
cd "D:\Đồ án tốt nghiệp\blockchain"
npx hardhat test
```

### 2.3. Kiểm thử Tích hợp Frontend
```powershell
cd "D:\Đồ án tốt nghiệp\frontend"
npm run build
```
Đảm bảo không có lỗi TypeScript/JSX hoặc lỗi cú pháp import.

---

## 3. Danh mục Ca kiểm thử Mẫu (Test Cases)

| Mã test case | Module | Mô tả hành động | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| `TC-SYS-01` | System | Gọi `GET /api/health` | HTTP 200, status: "UP", database: "CONNECTED" |
| `TC-AUTH-01`| Auth | Đăng nhập đúng username/mật khẩu | HTTP 200, trả về JWT access token hợp lệ |
| `TC-TRACE-01`| Blockchain | Tạo lô sản xuất `BATCH-TEST-01` | Lô được lưu vào DB và trả về txHash trên blockchain |
| `TC-TRACE-02`| Blockchain | Xác minh lô chưa qua sửa đổi | Hash khớp 100%, trạng thái: "VERIFIED_GENUINE" |
| `TC-TRACE-03`| Blockchain | Cố tình sửa đổi dữ liệu DB thủ công | Hệ thống phát hiện mismatch hash, cảnh báo "TAMPERED" |
| `TC-GIS-01` | GIS | Xem bản đồ nhà sản xuất tại Hà Giang | Hiển thị đúng Marker và popup thông tin liên quan |
