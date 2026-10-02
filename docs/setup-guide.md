# HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI (SETUP GUIDE)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Môi trường phát triển**: Windows 10/11 Local Development  

---

## 1. Yêu cầu Cài đặt Trước (Prerequisites)
1. **Java Development Kit**: JDK 21 hoặc JDK 23 (Đã cài: Oracle JDK 23)
2. **Node.js**: v20+ (Đã cài: v24.21.0, npm 11.19.0)
3. **PostgreSQL**: v15+ (Đã cài: PostgreSQL 17.5 chạy trên port 5432, user: `postgres`, pass: `123456`)
4. **Git**: Đã cài đặt

---

## 2. Thiết lập Cơ sở Dữ liệu PostgreSQL

Mở terminal hoặc pgAdmin:
```sql
-- Tạo database cho dự án
CREATE DATABASE ocop_db WITH OWNER postgres ENCODING 'UTF8';
```

Kiểm tra kết nối thành công:
```bash
psql -U postgres -h localhost -d ocop_db
```

---

## 3. Cấu hình & Chạy Backend (Spring Boot 3.x)

1. Di chuyển vào thư mục backend:
   ```bash
   cd "D:\Đồ án tốt nghiệp\backend"
   ```
2. Cấu hình database tại `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/ocop_db
       username: postgres
       password: ${DB_PASSWORD:123456}
   ```
3. Chạy backend bằng Maven Wrapper:
   ```powershell
   .\mvnw spring-boot:run
   ```
4. Kiểm tra Backend:
   - Endpoint kiểm tra sức khỏe: `http://localhost:8080/api/health`
   - Tài liệu OpenAPI: `http://localhost:8080/swagger-ui.html`

---

## 4. Cấu hình & Chạy Frontend (React + Vite)

1. Di chuyển vào thư mục frontend:
   ```bash
   cd "D:\Đồ án tốt nghiệp\frontend"
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt tại: `http://localhost:5173`

---

## 5. Cấu hình & Chạy Blockchain Local (Hardhat) *(Tuần 5)*

1. Di chuyển vào thư mục blockchain:
   ```bash
   cd "D:\Đồ án tốt nghiệp\blockchain"
   ```
2. Cài đặt Hardhat và thư viện Web3:
   ```bash
   npm install
   ```
3. Khởi chạy nút Ethereum cục bộ:
   ```bash
   npx hardhat node
   ```
4. Triển khai Smart Contract lên mạng local:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
