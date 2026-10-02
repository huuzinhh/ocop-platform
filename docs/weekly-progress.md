# NHẬT KÝ TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN (WEEKLY PROGRESS)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Sinh viên thực hiện**: huuzinhh  
**Thời lượng**: 9 tuần  

---

## Tuần 1: Khởi động, Kiến trúc Hệ thống & Khởi tạo Khung Ứng dụng
- [x] Đã hoàn thành 100% (Môi trường, Git, Bộ tài liệu `docs/`, PostgreSQL `ocop_db` 17 bảng, Spring Boot 3.3.4, React Vite).

---

## Tuần 2: Xây dựng Backend, REST API, Authentication (Spring Security 6 + JWT) & Phân quyền RBAC
- [x] Đã hoàn thành 100% (SecurityConfig Stateless, JJWT 0.12.6, BCrypt, AuthController, AuthContext, AuthModal, kiểm thử tự động `test_auth.ps1`).

---

## Tuần 3: Hoàn thiện Sản phẩm OCOP, Giỏ hàng, Đặt hàng & Thương mại điện tử

### 1. Việc đã hoàn thành
- [x] **Quản lý Giỏ hàng (Shopping Cart Context)**:
  - Tạo JPA Entity `Cart` và `CartItem` (quan hệ `@OneToOne` với User, `@OneToMany` với CartItem có `orphanRemoval = true`).
  - Tạo `CartRepository` và `CartItemRepository`.
  - Triển khai `CartService` và `CartController` với đầy đủ REST endpoints:
    - `GET /api/v1/cart`: Lấy thông tin giỏ hàng, tổng số lượng món và tổng tiền.
    - `POST /api/v1/cart/items`: Thêm sản phẩm vào giỏ, kiểm tra số lượng tồn kho khả dụng (`stock_quantity`).
    - `PUT /api/v1/cart/items/{itemId}`: Thay đổi số lượng mua.
    - `DELETE /api/v1/cart/items/{itemId}`: Xóa món khỏi giỏ hàng.
    - `DELETE /api/v1/cart`: Làm rỗng toàn bộ giỏ hàng.
- [x] **Quy trình Đặt hàng & Quản lý Đơn hàng (Order & Checkout Context)**:
  - Tạo JPA Entity `Order`, `OrderItem`, `Payment`, `Shipment`.
  - Sinh mã đơn hàng chuẩn nghiệp vụ: `OCOP-YYYYMMDD-XXXX`.
  - Xây dựng `OrderService` và `OrderController`:
    - `POST /api/v1/orders`: Tạo đơn hàng từ giỏ hàng, tự động trừ tồn kho sản phẩm trong Transaction, tạo bản ghi thanh toán & vận đơn `GHTK-OCOP-...`, xóa sạch giỏ hàng.
    - `GET /api/v1/orders`: Lấy lịch sử đơn hàng của người dùng đang đăng nhập.
    - `GET /api/v1/orders/{orderCode}`: Xem chi tiết đơn hàng.
    - `GET /api/v1/orders/all`: Lấy toàn bộ đơn hàng hệ thống (dành cho Admin / Nhà sản xuất).
    - `PUT /api/v1/orders/{orderCode}/status`: Cập nhật trạng thái đơn hàng (`PENDING` -> `CONFIRMED` -> `SHIPPING` -> `DELIVERED`).
- [x] **Cổng Thanh toán Mô phỏng (Mock Payment Module)**:
  - `POST /api/v1/orders/{orderCode}/mock-pay`: Hỗ trợ phương thức `MOCK_VNPAY`, `MOCK_MOMO`, `COD`.
  - Ghi nhận trạng thái thanh toán `SUCCESS`, sinh mã giao dịch `transaction_ref` và tự động đổi trạng thái đơn hàng sang `CONFIRMED`, trạng thái vận chuyển sang `IN_TRANSIT`.
- [x] **Phân hệ Đăng bán Sản phẩm OCOP (Producer & Admin Portal)**:
  - Thêm CRUD vào `ProductService` và `ProductController`:
    - `POST /api/v1/products`: Nhà sản xuất (`ROLE_PRODUCER`) hoặc Admin (`ROLE_ADMIN`) đăng bán sản phẩm OCOP mới (tên, danh mục, hạng sao 3-5 sao, giá bán, tồn kho, đơn vị tính, ảnh đại diện, mô tả và câu chuyện văn hóa OCOP).
    - `PUT /api/v1/products/{id}` & `DELETE /api/v1/products/{id}`: Cập nhật và xóa sản phẩm.
- [x] **Giao diện Người dùng Thương mại điện tử (React + Ant Design)**:
  - Xây dựng `CartContext` và hook `useCart()`.
  - Tạo component `CartDrawer.jsx`: Ngăn kéo giỏ hàng trượt từ phải sang, cập nhật số lượng trực quan, hiển thị miễn phí vận chuyển OCOP.
  - Tạo component `CheckoutModal.jsx`: Form đặt hàng điền thông tin người nhận, địa chỉ, ghi chú, chọn phương thức thanh toán và nút mô phỏng thanh toán 1-click.
  - Tạo component `OrdersModal.jsx`: Xem lịch sử đơn hàng cá nhân kèm huy hiệu trạng thái và nút thanh toán nhanh cho các đơn chờ.
  - Tạo component `CreateProductModal.jsx`: Form đăng bán sản phẩm OCOP mới dành cho Nhà sản xuất.
  - Cập nhật Header `App.jsx`: Icon Giỏ hàng có Badge số lượng món nhảy số thời gian thực, nút "Đăng sản phẩm" cho Producer, nút "Đơn hàng của tôi" trong menu tài khoản.
- [x] **Kiểm thử Tự động & Nghiệm thu End-to-End**:
  - Script `scripts/test_ecommerce.ps1` kiểm tra liên thông 100% 8 bước nghiệp vụ từ Đăng nhập Khách hàng -> Thêm giỏ hàng -> Đặt hàng -> Thanh toán mô phỏng VNPay -> Giỏ hàng tự động làm rỗng -> Nhà sản xuất đăng sản phẩm mới -> Kiểm tra lịch sử đơn hàng.

### 2. Các file quan trọng đã tạo / cập nhật trong Tuần 3
- `backend/`:
  - `src/main/java/com/ocop/entity/`: `Cart.java`, `CartItem.java`, `Order.java`, `OrderItem.java`, `Payment.java`, `Shipment.java`, cập nhật `Product.java`.
  - `src/main/java/com/ocop/repository/`: `CartRepository.java`, `CartItemRepository.java`, `OrderRepository.java`, `PaymentRepository.java`.
  - `src/main/java/com/ocop/dto/cart/`: `AddToCartRequest.java`, `UpdateCartItemRequest.java`, `CartItemDto.java`, `CartDto.java`.
  - `src/main/java/com/ocop/dto/order/`: `CreateOrderRequest.java`, `MockPaymentRequest.java`, `OrderItemDto.java`, `OrderDto.java`.
  - `src/main/java/com/ocop/dto/product/`: `CreateProductRequest.java`.
  - `src/main/java/com/ocop/service/`: `CartService.java`, `OrderService.java`, cập nhật `ProductService.java`.
  - `src/main/java/com/ocop/controller/`: `CartController.java`, `OrderController.java`, cập nhật `ProductController.java`.
- `frontend/`:
  - `src/api/cartApi.js` & `src/api/orderApi.js`: Tầng gọi API giỏ hàng và đơn hàng.
  - `src/context/CartContext.jsx`: Quản lý state giỏ hàng.
  - `src/components/`: `CartDrawer.jsx`, `CheckoutModal.jsx`, `OrdersModal.jsx`, `CreateProductModal.jsx`.
  - `src/App.jsx` & `src/main.jsx`: Tích hợp toàn diện UI TMĐT và CartProvider.
- `scripts/`:
  - `scripts/test_ecommerce.ps1`: Kịch bản kiểm thử tự động toàn diện TMĐT.

---

## Kế hoạch Tiếp theo: Tuần 4 — Quản lý OCOP, Nhà sản xuất, Lô sản xuất & Bản đồ Tương tác GIS

Mục tiêu Tuần 4:
1. **Quản lý Chứng nhận OCOP & Cơ sở sản xuất**:
   - Quản lý thông tin Hợp tác xã / Doanh nghiệp OCOP, địa chỉ, giấy chứng nhận OCOP, ngày cấp và thời hạn.
2. **Quản lý Lô sản xuất (Production Batches) & Nhật ký chuỗi cung ứng (Events)**:
   - Tạo lô sản xuất, ngày sản xuất, hạn sử dụng, sản lượng lô.
   - Ghi nhận các sự kiện: Thu hoạch (`HARVEST`), Chế biến (`PROCESSING`), Đóng gói (`PACKAGING`), Kiểm định (`QUALITY_INSPECTION`).
   - Tính toán hàm băm dữ liệu sự kiện (`raw_data_hash` SHA-256) làm tiền đề đẩy lên Blockchain ở Tuần 5.
3. **Bản đồ Tương tác GIS (Leaflet + OpenStreetMap)**:
   - Hiển thị bản đồ Việt Nam với Marker các vùng sản xuất và cơ sở OCOP trên tọa độ địa lý thực tế.
   - Click vào Marker mở Popup hiển thị hình ảnh Hợp tác xã, thông tin vùng nguyên liệu và danh sách đặc sản OCOP tương ứng.
   - Bộ lọc bản đồ theo Tỉnh/Thành phố và Hạng sao OCOP.
