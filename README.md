# NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ VÀ XÚC TIẾN THƯƠNG MẠI SẢN PHẨM OCOP TÍCH HỢP BLOCKCHAIN VÀ AI

> **Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
> **Thời gian thực hiện**: 9 tuần

---

## 1. Giới thiệu Tổng quan
Hệ thống cung cấp giải pháp toàn diện xúc tiến thương mại và bảo vệ thương hiệu sản phẩm OCOP Việt Nam (Chương trình Mỗi xã một sản phẩm):
1. **Sàn thương mại điện tử OCOP**: Tìm kiếm, giỏ hàng, đặt hàng, quản lý đơn và thanh toán mô phỏng.
2. **Bản đồ số GIS OCOP**: Bản đồ tương tác hiển thị vùng nguyên liệu, nhà sản xuất và làng nghề truyền thống.
3. **Truy xuất nguồn gốc bằng Blockchain**: Smart Contract lưu trữ băm dữ liệu (hash) của từng lô hàng và chuỗi sự kiện sản xuất - vận chuyển, xác minh qua mã QR.
4. **AI Gợi ý đặc sản & Trợ lý ảo RAG**: Đề xuất sản phẩm theo vùng miền, mùa vụ và chatbot tư vấn văn hóa OCOP.

---

## 2. Cấu trúc Thư mục

```text
├── docs/                 # Toàn bộ tài liệu đặc tả, kiến trúc, kiểm thử
├── backend/              # Mã nguồn Spring Boot 3.x (Java 23)
├── frontend/             # Ứng dụng Web React + Vite + Ant Design + Leaflet
├── blockchain/           # Smart Contract Solidity & Môi trường Hardhat
└── README.md             # Hướng dẫn tổng thể này
```

---

## 3. Yêu cầu Môi trường Khởi chạy
- **Java**: OpenJDK / Oracle JDK 21+ (Khuyến nghị 21 hoặc 23)
- **Node.js**: v20+ (Hiện tại máy chủ: v24.21.0)
- **PostgreSQL**: 15+ (Hiện tại máy chủ: v17.5 chạy trên port 5432)
- **Git**: 2.40+

---

## 4. Hướng dẫn Khởi chạy Từng bước

### Bước 1: Khởi tạo Cơ sở Dữ liệu
1. Mở PostgreSQL (port 5432).
2. Tạo database:
   ```sql
   CREATE DATABASE ocop_db;
   ```
3. Chạy script khởi tạo dữ liệu trong `backend/src/main/resources/schema.sql` (hoặc Spring Boot tự động chạy khi cấu hình JPA).

### Bước 2: Khởi chạy Backend (Spring Boot)
```bash
cd backend
./mvnw clean spring-boot:run
```
- API chạy tại: `http://localhost:8080`
- Swagger UI (tài liệu API trực quan): `http://localhost:8080/swagger-ui.html`

### Bước 3: Khởi chạy Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Giao diện người dùng truy cập tại: `http://localhost:5173`

---

## 5. Tài liệu Chi tiết
Xem thêm các tài liệu thiết kế và đặc tả trong thư mục `docs/`:
- [Yêu cầu hệ thống](docs/requirements.md)
- [Kiến trúc hệ thống](docs/architecture.md)
- [Thiết kế Cơ sở Dữ liệu](docs/database-design.md)
- [Đặc tả API](docs/api-specification.md)
- [Hướng dẫn Cài đặt](docs/setup-guide.md)
- [Hướng dẫn Kiểm thử](docs/testing-guide.md)
- [Nhật ký Tiến độ Hàng tuần](docs/weekly-progress.md)
- [Kịch bản Demo Bảo vệ](docs/demo-script.md)
