# NHẬT KÝ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (WEEKLY PROGRESS)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Sinh viên thực hiện**: huuzinhh  
**Thời lượng**: 9 tuần  

---

## Tuần 1: Khởi động, Kiến trúc Hệ thống & Khởi tạo Khung Ứng dụng
- [x] Đã hoàn thành 100% (Môi trường, Git, Bộ tài liệu `docs/`, PostgreSQL `ocop_db` 17 bảng, Spring Boot 3.3.4, React Vite).

---

## Tuần 2: Xây dựng Backend, REST API, Authentication (Spring Security 6 + JWT) & Phân quyền RBAC

### 1. Việc đã hoàn thành
- [x] **Cấu hình Spring Security 6**:
  - Triển khai `SecurityConfig` với chính sách Stateless `SessionCreationPolicy.STATELESS`.
  - Tích hợp CORS cho phép Frontend truy cập với đầy đủ HTTP Methods (GET, POST, PUT, DELETE, OPTIONS).
  - Vô hiệu hóa CSRF cho kiến trúc REST API không lưu trạng thái.
  - Phân quyền theo vai trò (RBAC): `ROLE_CUSTOMER`, `ROLE_PRODUCER`, `ROLE_ADMIN`.
- [x] **Xử lý Token JWT**:
  - Tích hợp thư viện JJWT hiện đại (`io.jsonwebtoken` v0.12.6).
  - Tạo `JwtTokenProvider` mã hóa chuẩn HMAC SHA-256 (khóa 256-bit), sinh token chứa Claims (`userId`, `email`, `fullName`, `roles`) với thời hạn 24 giờ.
  - Tạo `JwtAuthenticationFilter` tự động chặn request, bóc tách `Authorization: Bearer <token>` và thiết lập `SecurityContext`.
  - Tạo `JwtAuthenticationEntryPoint` trả về lỗi HTTP 401 Unauthorized dạng JSON chuẩn hóa.
- [x] **Quản lý Tài khoản & Mã hóa Mật khẩu**:
  - Tạo Entity `User` và `Role`, ánh xạ quan hệ nhiều - nhiều `@ManyToMany` qua bảng `user_roles`.
  - Mã hóa mật khẩu bảo mật bằng thuật toán một chiều có muối `BCryptPasswordEncoder`.
  - Đồng bộ và kiểm tra hash BCrypt thực tế cho 3 tài khoản demo:
    - Quản trị viên: `admin` / `123456` (`ROLE_ADMIN`)
    - Nhà sản xuất: `producer_finho` / `123456` (`ROLE_PRODUCER`)
    - Khách hàng: `customer_demo` / `123456` (`ROLE_CUSTOMER`)
  - Khắc phục lỗi lệch sequence tự tăng trong PostgreSQL sau khi import dữ liệu (`setval`).
- [x] **Xây dựng REST API Xác thực (AuthController & AuthService)**:
  - `POST /api/v1/auth/login`: Xác thực username/email + password, trả về JWT Token và DTO User.
  - `POST /api/v1/auth/register`: Đăng ký tài khoản mới, kiểm tra trùng lặp và gán quyền theo lựa chọn (`CUSTOMER` hoặc `PRODUCER`).
  - `GET /api/v1/auth/me`: Endpoint bảo vệ yêu cầu JWT Bearer Token, trả về hồ sơ tài khoản hiện tại.
  - Kích hoạt tính năng xác thực Bearer Token trong Swagger UI (`OpenApiConfig`).
- [x] **Tích hợp Xác thực lên Giao diện Frontend (React + Ant Design)**:
  - Xây dựng `AuthContext` và hook `useAuth()` quản lý trạng thái đăng nhập, lưu token và user vào `localStorage`.
  - Cập nhật `axiosClient.js` tự động đính kèm `Authorization: Bearer <token>` vào mọi yêu cầu.
  - Tạo component `AuthModal.jsx` với giao diện đăng nhập và đăng ký 2 tab đẹp mắt, có hiển thị sẵn thông tin tài khoản mẫu.
  - Cập nhật Header trong `App.jsx`: hiển thị Avatar, tên người dùng, Tag quyền hạn (`ROLE_ADMIN`, `ROLE_PRODUCER`, `ROLE_CUSTOMER`), menu dropdown và nút Đăng xuất.
- [x] **Kiểm thử tự động & Nghiệm thu End-to-End**:
  - Chạy kịch bản kiểm thử tự động `scripts/test_auth.ps1` kiểm tra toàn bộ chu trình (Login Admin -> Gọi /auth/me thành công -> Register người dùng mới -> Login người dùng mới thành công). Toàn bộ 4 test case đều đạt 100%.

### 2. Các file quan trọng đã tạo / cập nhật trong Tuần 2
- `backend/`:
  - `pom.xml`: Thêm `spring-boot-starter-security` và `jjwt` (0.12.6).
  - `src/main/resources/application.yml`: Cấu hình secret và expiration cho JWT.
  - `src/main/java/com/ocop/entity/Role.java` & `User.java`: Entity JPA phân quyền và tài khoản.
  - `src/main/java/com/ocop/repository/RoleRepository.java` & `UserRepository.java`.
  - `src/main/java/com/ocop/security/`: `JwtTokenProvider`, `JwtAuthenticationFilter`, `JwtAuthenticationEntryPoint`, `UserPrincipal`, `CustomUserDetailsService`, `SecurityConfig`.
  - `src/main/java/com/ocop/dto/auth/`: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `UserDto`.
  - `src/main/java/com/ocop/service/AuthService.java` & `controller/AuthController.java`.
  - `src/main/java/com/ocop/config/OpenApiConfig.java` & `CorsConfig.java`.
- `frontend/`:
  - `src/context/AuthContext.jsx`: Quản lý state đăng nhập toàn cầu.
  - `src/api/authApi.js`: Các hàm gọi API đăng ký, đăng nhập, me.
  - `src/api/axiosClient.js`: Request interceptor gắn Bearer token.
  - `src/components/AuthModal.jsx`: Modal đăng nhập / đăng ký.
  - `src/App.jsx` & `src/main.jsx`: Tích hợp Header, Avatar và AuthProvider.
- `scripts/`:
  - `test_auth.ps1`: Kịch bản test tự động luồng xác thực và phân quyền.
  - `sync_sequences.sql`: Khắc phục lỗi sequence ID tự tăng.

### 3. Kết quả kiểm thử thực tế
- **Login Admin**: Trả về `success: true`, mã JWT Bearer hợp lệ.
- **Get Me**: Trả về đúng thông tin `admin` kèm quyền `ROLE_ADMIN`.
- **Register**: Đăng ký người dùng `test_farmer_2376` thành công, lưu vào DB và gán quyền `ROLE_PRODUCER`.
- **Login người dùng mới**: Đăng nhập ngay lập tức với tài khoản vừa đăng ký thành công.
- **Frontend SPA**: Giao diện chạy mượt mà tại `http://localhost:5173`, popup Đăng nhập hoạt động chính xác.

---

## Kế hoạch Tiếp theo: Tuần 3 — Hoàn thiện Sản phẩm, Giỏ hàng, Đặt hàng & Thương mại điện tử

Mục tiêu Tuần 3:
1. **Quản lý Sản phẩm OCOP Nâng cao**:
   - API và giao diện Thêm / Sửa / Xóa sản phẩm dành riêng cho Nhà sản xuất (`ROLE_PRODUCER`) và Admin (`ROLE_ADMIN`).
   - Tải lên hình ảnh sản phẩm và nhập câu chuyện di sản OCOP.
2. **Giỏ hàng (Shopping Cart)**:
   - Entity `Cart` và `CartItem`, API Thêm vào giỏ, Cập nhật số lượng, Xóa khỏi giỏ.
   - Giao diện Giỏ hàng dạng Drawer/Trang riêng ở Frontend với badge đếm số lượng món.
3. **Quy trình Đặt hàng & Thanh toán mô phỏng (Checkout & Order)**:
   - Entity `Order` và `OrderItem`, sinh mã đơn hàng duy nhất (`order_code`).
   - Form Checkout nhập địa chỉ nhận hàng, số điện thoại, ghi chú.
   - Module Thanh toán mô phỏng (Mock VNPay/MoMo/COD) ghi nhận trạng thái thanh toán.
   - Quản lý trạng thái đơn hàng (PENDING -> CONFIRMED -> SHIPPING -> DELIVERED).
