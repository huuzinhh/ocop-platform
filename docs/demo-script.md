# KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN TỐT NGHIỆP (DEMO SCRIPT)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Thời gian trình bày dự kiến**: 10 - 15 phút  

---

## 1. Mục đích Kịch bản
Cung cấp luồng trình diễn sản phẩm hoàn chỉnh, mượt mà và thuyết phục nhất trước Hội đồng chấm tốt nghiệp, nêu bật được 4 trụ cột công nghệ:
1. **Thương mại điện tử & Trải nghiệm người dùng**.
2. **Bản đồ số GIS đặc sản vùng miền**.
3. **Blockchain xác minh tính toàn vẹn chuỗi cung ứng**.
4. **AI Recommendation & Trợ lý ảo RAG**.

---

## 2. Kịch bản Chi tiết Từng Bước

### Phút 1 - 3: Giới thiệu & Khám phá Sàn OCOP
- **Hành động**: Đăng nhập tài khoản Khách hàng (`customer@ocop.vn`).
- **Trình diễn**:
  - Trang chủ giới thiệu văn hóa OCOP theo từng vùng miền (Đông Bắc, Tây Bắc, Đồng bằng sông Cửu Long...).
  - Tìm kiếm sản phẩm, lọc theo hạng 4 sao, 5 sao.
  - Xem trang chi tiết một sản phẩm tiêu biểu (ví dụ: Chè Shan Tuyết cổ thụ Hà Giang), đọc câu chuyện văn hóa của sản phẩm.

### Phút 4 - 6: Trực quan hóa Bản đồ Số GIS
- **Hành động**: Bấm vào tab "Bản đồ OCOP" (GIS Map).
- **Trình diễn**:
  - Bản đồ Việt Nam hiển thị các cụm điểm sản xuất và làng nghề.
  - Phóng to khu vực tỉnh Hà Giang / Bến Tre, click vào Marker của Hợp tác xã.
  - Xem thông tin địa chỉ, tọa độ GPS thực tế và danh sách các sản phẩm OCOP được chứng nhận tại cơ sở này.

### Phút 7 - 10: Điểm nhấn Đồ án - Blockchain Truy xuất Nguồn gốc & Toàn vẹn Dữ liệu
- **Hành động 1 (Phía Nhà sản xuất)**:
  - Đăng nhập tài khoản Hợp tác xã (`producer@ocop.vn`).
  - Mở trang "Quản lý Lô sản xuất" -> Bấm "Tạo lô hàng mới".
  - Thêm một sự kiện chuỗi cung ứng: "Đóng gói chân không & Dán tem kiểm định".
  - Bấm "Ghi nhận lên Blockchain" -> Hệ thống tạo mã SHA-256 và gửi giao dịch đến Smart Contract, hiển thị Transaction Hash và mã QR.
- **Hành động 2 (Phía Khách hàng / Hội đồng kiểm chứng)**:
  - Quét mã QR hoặc nhập mã lô vào trang tra cứu `/trace/{batchCode}`.
  - Xem Timeline toàn bộ các khâu từ thu hoạch đến phân phối.
  - **Điểm sáng tạo nhất**: Bấm nút **"Kiểm tra tính toàn vẹn dữ liệu"**.
    - *Trường hợp bình thường*: Dữ liệu băm tính từ database khớp 100% với giá trị ghi trên Smart Contract -> Hiển thị huy hiệu **"Dữ liệu Toàn vẹn - Xác thực từ Blockchain"**.
    - *Trường hợp giả lập gian lận*: Sửa đổi 1 chữ trong mô tả ở database -> Hệ thống lập tức phát hiện mã băm không khớp và hiển thị cảnh báo đỏ **"Dữ liệu có dấu hiệu bị can thiệp trái phép"**.

### Phút 11 - 13: Trí tuệ Nhân tạo AI
- **Hành động**: 
  - Xem danh sách "Gợi ý dành cho bạn": Thuật toán Recommendation tính điểm tương đồng đặc sản theo vùng miền và thói quen.
  - Mở Chatbot RAG ở góc màn hình: Đặt câu hỏi tự nhiên về quy trình làm chè hoặc tiêu chí OCOP 4 sao -> Chatbot trả lời chính xác trích dẫn từ tài liệu văn hóa OCOP.

### Phút 14 - 15: Kết luận & Trả lời Câu hỏi của Hội đồng
- Tóm tắt kiến trúc hệ thống, các công nghệ đã làm chủ và hướng phát triển mở rộng.
