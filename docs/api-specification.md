# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Mã tài liệu**: API-OCOP-01  
**Giao thức**: HTTP/1.1 RESTful JSON  
**Swagger UI**: `http://localhost:8080/swagger-ui.html`  

---

## 1. Chuẩn Quy ước Chung (Conventions)

### 1.1. Cấu trúc Phản hồi Chung (Standard Response Envelope)
Tất cả các API đều trả về định dạng JSON thống nhất:
```json
{
  "success": true,
  "message": "Thông báo kết quả thao tác",
  "data": { ... },
  "timestamp": "2026-10-02T13:30:00Z"
}
```

Trong trường hợp lỗi:
```json
{
  "success": false,
  "message": "Nội dung lỗi chi tiết",
  "errorCode": "ERR_VALIDATION / ERR_NOT_FOUND / ERR_UNAUTHORIZED",
  "errors": [ "Trường name không được để trống" ],
  "timestamp": "2026-10-02T13:30:00Z"
}
```

### 1.2. Xác thực (Authentication)
Gửi kèm header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 2. Danh mục Endpoints Cốt lõi

### Nhóm 0: Kiểm tra Hệ thống (System Health)
- `GET /api/health`: Trả về trạng thái hoạt động của Backend, kết nối Database PostgreSQL.

### Nhóm 1: Quản lý Người dùng & Xác thực (Auth)
- `POST /api/v1/auth/register`: Đăng ký tài khoản mới.
- `POST /api/v1/auth/login`: Đăng nhập, nhận Access Token & thông tin tài khoản.
- `GET /api/v1/auth/me`: Lấy thông tin người dùng hiện tại đang đăng nhập.

### Nhóm 2: Sản phẩm OCOP & Gian hàng
- `GET /api/v1/products`: Danh sách sản phẩm (hỗ trợ phân trang, lọc theo `starRating`, `category`, `province`, `search`).
- `GET /api/v1/products/{id}`: Chi tiết sản phẩm, chứng nhận OCOP, câu chuyện văn hóa và nhà sản xuất.
- `POST /api/v1/products`: Thêm mới sản phẩm (ROLE_PRODUCER / ROLE_ADMIN).
- `PUT /api/v1/products/{id}`: Cập nhật thông tin sản phẩm.
- `GET /api/v1/categories`: Danh sách các phân loại sản phẩm OCOP.

### Nhóm 3: Bản đồ Số GIS
- `GET /api/v1/gis/producers`: Danh sách nhà sản xuất kèm tọa độ GPS (`latitude`, `longitude`), số lượng sản phẩm OCOP để render các Marker trên bản đồ Leaflet.

### Nhóm 4: Lô sản xuất & Blockchain Truy xuất Nguồn gốc
- `POST /api/v1/batches`: Khởi tạo lô sản xuất, tính mã băm SHA-256 và phát hành giao dịch Smart Contract.
- `GET /api/v1/batches/{batchCode}`: Lấy thông tin lô hàng và các sự kiện chuỗi cung ứng.
- `POST /api/v1/batches/{batchCode}/events`: Bổ sung sự kiện chuỗi cung ứng (Thu hoạch, Đóng gói...).
- `GET /api/v1/trace/{batchCode}/verify`: Kiểm tra tính toàn vẹn dữ liệu lô hàng đối chiếu với Blockchain.

### Nhóm 5: Giỏ hàng & Đơn hàng (E-Commerce)
- `GET /api/v1/cart`: Lấy giỏ hàng của người dùng hiện tại.
- `POST /api/v1/cart/items`: Thêm sản phẩm vào giỏ hàng.
- `PUT /api/v1/cart/items/{itemId}`: Thay đổi số lượng.
- `DELETE /api/v1/cart/items/{itemId}`: Xóa khỏi giỏ.
- `POST /api/v1/orders`: Tạo đơn hàng mới từ giỏ hàng.
- `GET /api/v1/orders/{orderCode}`: Xem chi tiết đơn hàng.
- `POST /api/v1/orders/{orderCode}/mock-pay`: Thanh toán mô phỏng (VNPay/MoMo).
