# NHẬT KÝ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (WEEKLY PROGRESS)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Sinh viên thực hiện**: huuzinhh  
**Thời lượng**: 9 tuần  

---

## Tuần 1: Khởi động, Kiến trúc Hệ thống & Khởi tạo Khung Ứng dụng

### 1. Việc đã hoàn thành
- [x] Kiểm tra và xác thực toàn bộ môi trường phát triển trên máy tính (Java 23, Node.js 24, PostgreSQL 17, Docker, Git).
- [x] Thiết lập phân quyền ghi NTFS cho thư mục làm việc `D:\Đồ án tốt nghiệp`.
- [x] Khởi tạo Git repository và cấu hình `.gitignore` toàn diện.
- [x] Soạn thảo toàn bộ tài liệu kiến trúc, đặc tả yêu cầu, thiết kế CSDL, hướng dẫn cài đặt và kiểm thử trong thư mục `docs/`.
- [x] Khởi tạo Cơ sở Dữ liệu PostgreSQL `ocop_db` và nạp schema chuẩn gồm 17 bảng (`schema.sql`) cùng dữ liệu mẫu OCOP (`data.sql`).
- [x] Khởi tạo Backend Spring Boot 3.3.4 (Java 23) với Maven Wrapper 3.9.9, cấu hình HikariCP, JPA Hibernate, Swagger OpenAPI 3 (`/swagger-ui.html`) và các REST API (`/api/health`, `/api/v1/products`, `/api/v1/categories`).
- [x] Chạy kiểm thử tự động Spring Boot Test (`com.ocop.OcopBackendApplicationTests`) thành công 100%.
- [x] Khởi tạo Frontend React + Vite + Ant Design, cấu hình Axios API client, giao diện hiển thị trạng thái kết nối Backend/Database và thẻ sản phẩm OCOP chuẩn hóa.
- [x] Kiểm thử liên thông End-to-End thực tế: Frontend (`http://localhost:5173`) ↔ Backend (`http://localhost:8080`) ↔ Database PostgreSQL 17 (`localhost:5432/ocop_db`).

### 2. Các file quan trọng đã tạo
- `.gitignore`: Cấu hình bỏ qua các file build cho Java, Node, Python, Hardhat.
- `README.md`: Hướng dẫn tổng quan khởi chạy dự án.
- `docs/`:
  - `docs/requirements.md`: Đặc tả các yêu cầu chức năng và phi chức năng.
  - `docs/architecture.md`: Sơ đồ kiến trúc phân tầng, Bounded Contexts và luồng nghiệp vụ.
  - `docs/database-design.md`: Thiết kế 20 bảng cơ sở dữ liệu và sơ đồ ERD.
  - `docs/api-specification.md`: Quy ước chuẩn và danh mục các REST endpoint.
  - `docs/setup-guide.md`: Hướng dẫn thiết lập môi trường chi tiết.
  - `docs/testing-guide.md`: Chiến lược kiểm thử và danh mục test cases.
  - `docs/weekly-progress.md`: Tài liệu nhật ký này.
  - `docs/demo-script.md`: Kịch bản 15 phút demo bảo vệ trước Hội đồng.
- `backend/`:
  - `pom.xml`: Khai báo phụ thuộc Spring Boot 3.3.4, Java 23, JPA, Postgres, Swagger.
  - `.mvn/wrapper/`: Maven Wrapper v3.9.9.
  - `src/main/resources/schema.sql` & `data.sql`: DDL 17 bảng và dữ liệu mẫu OCOP 3-5 sao.
  - `src/main/resources/application.yml`: Cấu hình datasource và Swagger.
  - `src/main/java/com/ocop/`: Các Entity (Product, Category, Producer, Location), Repository, Service, Controller và CorsConfig.
- `frontend/`:
  - `package.json`: Ant Design 5, Axios, React Router, Leaflet.
  - `src/api/axiosClient.js` & `src/api/ocopApi.js`: Tầng gọi API.
  - `src/App.jsx`: Giao diện Dashboard OCOP, Banner giám sát hệ thống, Grid sản phẩm OCOP và Modal câu chuyện di sản.

### 3. Các lệnh đã chạy thực tế & Kết quả
- `powershell icacls "D:\Đồ án tốt nghiệp" /grant "Users:(OI)(CI)F" /T`: Cấp quyền ghi thành công.
- `git init`: Khởi tạo Git repo thành công.
- `setup_postgres.ps1`: Tạo `ocop_db` và khởi tạo 17 bảng, 4 nhà sản xuất, 4 sản phẩm OCOP, 1 lô hàng mẫu.
- `mvn clean compile`: `BUILD SUCCESS` (Java 23).
- `mvnw.cmd test`: `BUILD SUCCESS` (1 test pass, 0 failure).
- `npm run build`: `built in 22.59s` không có lỗi.
- `curl.exe http://localhost:8080/api/health`: Trả về `{"status":"UP","database":"CONNECTED"}`.
- `curl.exe http://localhost:8080/api/v1/products`: Trả về danh sách 4 sản phẩm OCOP kèm nhà sản xuất và tọa độ GIS.
- `curl.exe -I http://localhost:5173`: Trả về `HTTP/1.1 200 OK`.

### 4. Vấn đề phát sinh & Cách xử lý
1. *Vấn đề*: Quyền ghi thư mục ổ `D:\` bị chặn bởi chính sách bảo mật Windows.  
   *Cách xử lý*: Cấp quyền Full Control cho nhóm `Users` qua lệnh `icacls`.
2. *Vấn đề*: Maven 3.6.3 cũ của hệ thống có thể cảnh báo với Java 23.  
   *Cách xử lý*: Cài đặt Maven Wrapper `mvnw` phiên bản 3.9.9 đi kèm dự án để đảm bảo tương thích tuyệt đối.

### 5. Việc tiếp theo (Tuần 2)
- Triển khai Spring Security và JSON Web Token (JWT).
- API Đăng ký, Đăng nhập, Phân quyền (ROLE_CUSTOMER, ROLE_PRODUCER, ROLE_ADMIN).
- Tích hợp AuthContext vào Frontend (Form Đăng nhập, Đăng ký, Lưu token).
