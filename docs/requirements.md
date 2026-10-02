# ĐẶC TẢ YÊU CẦU HỆ THỐNG (SYSTEM REQUIREMENTS)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Mã tài liệu**: REQ-OCOP-01  
**Phiên bản**: 1.0.0  

---

## 1. Giới thiệu & Mục tiêu Hệ thống

### 1.1. Bối cảnh
Chương trình "Mỗi xã một sản phẩm" (OCOP) là trọng tâm phát triển kinh tế nông thôn Việt Nam. Tuy nhiên, các sản phẩm OCOP hiện nay gặp phải các thách thức:
- Khó tiếp cận người tiêu dùng toàn quốc qua kênh thương mại điện tử chuyên biệt.
- Thiếu công cụ chứng minh nguồn gốc xuất xứ tin cậy, nguy cơ bị làm giả, làm nhái thương hiệu OCOP.
- Người tiêu dùng thiếu thông tin về câu chuyện văn hóa, bản sắc và mùa vụ của đặc sản vùng miền.

### 1.2. Mục tiêu
Xây dựng nền tảng tích hợp công nghệ cao:
1. **Thương mại điện tử**: Mua bán, quản lý gian hàng, giỏ hàng, thanh toán mô phỏng và vận chuyển.
2. **Quản lý OCOP & Bản đồ số GIS**: Quản lý chứng nhận OCOP 3-5 sao, vùng sản xuất, làng nghề và định vị trực quan trên bản đồ.
3. **Blockchain**: Ghi nhận bất biến thông tin lô hàng, hash dữ liệu các khâu sản xuất và cung ứng, cho phép người tiêu dùng quét mã QR để đối soát tính toàn vẹn dữ liệu.
4. **AI (Recommendation & RAG Chatbot)**: Gợi ý đặc sản theo hành vi/vùng miền và trợ lý ảo thông minh giải đáp thông tin văn hóa OCOP.

---

## 2. Các Vai trò Người dùng (User Personas & Roles)

1. **Khách hàng (Customer - ROLE_CUSTOMER)**:
   - Tìm kiếm, lọc sản phẩm OCOP theo tỉnh thành, hạng sao (3*, 4*, 5*).
   - Xem bản đồ tương tác GIS các làng nghề và vùng trồng OCOP.
   - Thêm giỏ hàng, đặt hàng, theo dõi đơn hàng và thanh toán mô phỏng.
   - Quét mã QR trên bao bì sản phẩm hoặc nhập mã lô để tra cứu chuỗi hành trình và kiểm tra tính toàn vẹn trên Blockchain.
   - Trò chuyện với AI Chatbot để nhận tư vấn đặc sản và nguồn gốc.

2. **Nhà sản xuất / Hợp tác xã (Producer - ROLE_PRODUCER)**:
   - Đăng ký hồ sơ đơn vị sản xuất, cập nhật tọa độ GPS vùng sản xuất.
   - Đăng bán sản phẩm, gắn thông tin chứng nhận OCOP (mã chứng nhận, ngày cấp, đơn vị cấp).
   - Tạo lô sản xuất (Batch) và sinh mã QR Code.
   - Ghi nhận các sự kiện nhật ký chuỗi cung ứng (Thu hoạch, Chế biến, Đóng gói, Kiểm định, Xuất kho) để lưu hash lên Blockchain.
   - Quản lý đơn hàng phát sinh từ gian hàng của mình.

3. **Quản trị viên Hệ thống (Administrator - ROLE_ADMIN)**:
   - Quản lý người dùng, duyệt hồ sơ nhà sản xuất.
   - Kiểm duyệt sản phẩm và thông tin chứng nhận OCOP.
   - Giám sát trạng thái hoạt động của Smart Contract, dịch vụ AI và hệ thống.

---

## 3. Yêu cầu Chức năng Chi tiết (Functional Requirements)

### Phân hệ 1: Quản lý Người dùng & Xác thực (Auth)
- **FR-AUTH-01**: Đăng ký tài khoản (hỗ trợ chọn vai trò Khách hàng hoặc Nhà sản xuất).
- **FR-AUTH-02**: Đăng nhập bằng email/username và mật khẩu, cấp phát JSON Web Token (Access Token & Refresh Token).
- **FR-AUTH-03**: Quản lý thông tin cá nhân và đổi mật khẩu.
- **FR-AUTH-04**: Phân quyền truy cập các tài nguyên API (Role-Based Access Control - RBAC).

### Phân hệ 2: Danh mục & Sản phẩm OCOP
- **FR-PROD-01**: Quản lý danh mục đặc sản (Nông sản thực phẩm, Thảo dược, Thủ công mỹ nghệ, Đồ uống...).
- **FR-PROD-02**: CRUD sản phẩm OCOP với các thông tin: Tên, Hạng sao (3, 4, 5 sao), Giá, Số lượng tồn, Đơn vị tính, Mô tả, Câu chuyện sản phẩm (Cultural Story).
- **FR-PROD-03**: Quản lý chứng nhận OCOP: Mã chứng nhận, Ngày cấp, Ngày hết hạn, Cơ quan cấp.
- **FR-PROD-04**: Quản lý hồ sơ Nhà sản xuất: Tên HTX/Doanh nghiệp, Địa chỉ hành chính (Tỉnh, Huyện, Xã), Tọa độ địa lý (Kinh độ/Vĩ độ).

### Phân hệ 3: Thương mại điện tử (E-Commerce)
- **FR-ECOMM-01**: Tìm kiếm sản phẩm theo từ khóa, lọc theo Hạng sao OCOP, Khoảng giá, Tỉnh thành.
- **FR-ECOMM-02**: Giỏ hàng (Thêm, Sửa số lượng, Xóa món, Tính tổng tiền).
- **FR-ECOMM-03**: Đặt hàng (Checkout) với thông tin người nhận, địa chỉ giao hàng và ghi chú.
- **FR-ECOMM-04**: Cổng thanh toán mô phỏng (Mock VNPay/MoMo/COD) có ghi nhận mã giao dịch và trạng thái.
- **FR-ECOMM-05**: Theo dõi trạng thái đơn hàng (Chờ xác nhận -> Đang đóng gói -> Đang giao -> Đã giao -> Đã hủy).

### Phân hệ 4: Bản đồ Số GIS (Geographic Information System)
- **FR-GIS-01**: Hiển thị bản đồ Việt Nam tương tác (Leaflet) tích hợp OpenStreetMap.
- **FR-GIS-02**: Đánh dấu (Marker) các địa điểm sản xuất OCOP kèm tooltip hiển thị tên, hạng sao và hình ảnh đại diện.
- **FR-GIS-03**: Lọc các điểm sản xuất trên bản đồ theo Tỉnh/Thành phố hoặc Phân loại sản phẩm.
- **FR-GIS-04**: Click vào Marker điều hướng trực tiếp đến trang gian hàng hoặc danh sách sản phẩm của HTX đó.

### Phân hệ 5: Blockchain & Truy xuất Nguồn gốc (Traceability)
- **FR-TRACE-01**: Nhà sản xuất tạo Lô sản xuất (`batch_code`) với ngày sản xuất và hạn sử dụng.
- **FR-TRACE-02**: Hệ thống tự động tính mã băm (SHA-256) dữ liệu lô và gọi Smart Contract đăng ký lô hàng trên Blockchain.
- **FR-TRACE-03**: Ghi nhận các sự kiện nhật ký chuỗi cung ứng (Thu hoạch, Chế biến, Kiểm định, Đóng bao...) kèm timestamp và hash dữ liệu lên Blockchain.
- **FR-TRACE-04**: Tự động sinh mã QR Code liên kết đến trang tra cứu công khai.
- **FR-TRACE-05**: Trang tra cứu truy xuất nguồn gốc hiển thị:
  - Thông tin sản phẩm, chứng nhận OCOP và nhà sản xuất.
  - Dòng thời gian (Timeline) các sự kiện thực tế.
  - Thông tin giao dịch Blockchain (Mã giao dịch `txHash`, Địa chỉ Smart Contract, Block Number).
  - Nút **"Xác minh tính toàn vẹn"**: Tính lại SHA-256 dữ liệu thực tế trong DB và đối chiếu với giá trị Hash lưu trên Smart Contract. Nếu trùng khớp -> Báo hợp lệ (Dữ liệu không bị sửa đổi trái phép).

### Phân hệ 6: Trí tuệ Nhân tạo AI (Giai đoạn sau)
- **FR-AI-01**: Gợi ý sản phẩm liên quan theo nội dung (Content-based Filtering: Tỉnh thành, Hạng sao, Mùa vụ).
- **FR-AI-02**: RAG Chatbot hỗ trợ giải đáp văn hóa đặc sản và hướng dẫn mua hàng dựa trên cơ sở tri thức OCOP.

---

## 4. Yêu cầu Phi Chức năng (Non-Functional Requirements)

1. **Hiệu năng & Tốc độ**: Thời gian phản hồi API < 500ms cho các truy vấn thông thường; giao diện React phản hồi mượt mà.
2. **Bảo mật**: Mật khẩu mã hóa bằng BCrypt; API bảo vệ bằng JWT; Không lưu khóa riêng tư (Private Key) hay API key trong mã nguồn public.
3. **Tính toàn vẹn**: Dữ liệu hash lưu trên Blockchain là bất biến và minh bạch.
4. **Khả năng giải thích (Defendability)**: Toàn bộ luồng dữ liệu, thuật toán và mã nguồn phải tường minh, có tài liệu phục vụ báo cáo và bảo vệ đồ án tốt nghiệp.
