# KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

**Đề tài**: Xây dựng nền tảng thương mại điện tử và xúc tiến thương mại sản phẩm OCOP tích hợp Blockchain truy xuất nguồn gốc và AI gợi ý đặc sản vùng miền  
**Mã tài liệu**: ARCH-OCOP-01  
**Phiên bản**: 1.0.0  

---

## 1. Phong cách Kiến trúc (Architectural Style)

Hệ thống được thiết kế theo mô hình **Service-Oriented / Pragmatic Microservices**, tối ưu hóa cho đồ án tốt nghiệp trong 9 tuần, cân bằng giữa việc phân chia ranh giới nghiệp vụ sạch sẽ và khả năng vận hành ổn định trên máy tính cá nhân.

```mermaid
flowchart TD
    subgraph ClientLayer["1. Tầng Trình bày (Presentation Layer)"]
        SPA["React SPA (Vite + Ant Design)\n- Khách hàng (Storefront + Map GIS + Trace)\n- Nhà sản xuất (Producer Portal)\n- Quản trị viên (Admin Dashboard)"]
    end

    subgraph APILayer["2. Tầng Gateway & Điều phối (API Gateway Layer)"]
        GATEWAY["API Gateway / Spring Cloud / Reverse Proxy\nPort 8080\n(JWT Filter, Routing, Rate Limit, CORS)"]
    end

    subgraph ServiceLayer["3. Tầng Dịch vụ Nghiệp vụ (Business Services Layer)"]
        subgraph SpringServices["Spring Boot Core Services"]
            AUTH_SRV["Auth Service\n(User, Role, JWT, BCrypt)"]
            PROD_SRV["OCOP Product & GIS Service\n(Catalog, Certificates, Coordinates)"]
            ORDER_SRV["Order & E-Commerce Service\n(Cart, Orders, Mock Payment)"]
            TRACE_SRV["Traceability Service\n(Batches, Events, SHA-256 Hasher)"]
        end

        subgraph HardhatService["Blockchain Layer"]
            NODE["Hardhat EVM Local Node (Port 8545)\nSmart Contract: OcopTraceability.sol"]
        end

        subgraph AIService["AI Layer (Python FastAPI - Port 8000)"]
            REC_SRV["Recommendation Service (Scikit-Learn)"]
            RAG_SRV["RAG Chatbot Service (LangChain / pgvector)"]
        end
    end

    subgraph StorageLayer["4. Tầng Dữ liệu (Persistence Layer)"]
        PG[(PostgreSQL 17\nPort 5432\nDatabase: ocop_db)]
    end

    SPA -->|RESTful JSON / HTTP| GATEWAY
    GATEWAY --> AUTH_SRV
    GATEWAY --> PROD_SRV
    GATEWAY --> ORDER_SRV
    GATEWAY --> TRACE_SRV
    GATEWAY --> AIService

    TRACE_SRV -->|JSON-RPC / Web3j / Ethers| NODE
    AUTH_SRV --> PG
    PROD_SRV --> PG
    ORDER_SRV --> PG
    AIService --> PG
```

---

## 2. Ranh giới Phân chia Dịch vụ (Bounded Contexts)

1. **Frontend Web (React + Ant Design)**:
   - Giao diện SPA hiện đại, responsive trên desktop và mobile web.
   - Thư viện hiển thị bản đồ GIS: `leaflet` và `react-leaflet`.
   - Thư viện đọc và quét QR Code: `html5-qrcode`.

2. **Backend Core (Java Spring Boot 3.x)**:
   - Quản lý logic nghiệp vụ cốt lõi, quy tắc toàn vẹn dữ liệu, giao dịch database và xác thực người dùng.
   - Kết nối cơ sở dữ liệu qua **Spring Data JPA / Hibernate**.
   - Tài liệu API tự động qua **SpringDoc OpenAPI 3 (Swagger UI)**.

3. **Blockchain Node (Hardhat & Solidity)**:
   - Khởi chạy một mạng Ethereum ảo cục bộ (Local EVM) tại `http://127.0.0.1:8545`.
   - Hợp đồng thông minh `OcopTraceability.sol` chỉ lưu trữ:
     - `batchCode`: Khóa định danh lô hàng.
     - `dataHash`: Mã SHA-256 của thông tin lô và các chứng từ kiểm định.
     - `events`: Danh sách các mốc thời gian và mã băm của từng công đoạn sản xuất.
     - `timestamp`: Thời điểm ghi nhận bất biến trên mạng phân tán.

4. **AI Service (Python 3.11 + FastAPI)** *(Triển khai ở Tuần 7 - 8)*:
   - Tách biệt service Python để tận dụng tối đa thư viện Machine Learning và NLP mà không làm nặng backend Java.
   - Tương tác với Backend thông qua REST API chuẩn JSON.

---

## 3. Luồng Hoạt động Tiêu biểu (Key Workflows)

### 3.1. Luồng Ghi nhận Lô hàng & Đưa mã Băm lên Blockchain
```mermaid
sequenceDiagram
    autonumber
    actor Producer as Nhà sản xuất
    participant FE as Frontend React
    participant BE as Backend Spring Boot
    participant DB as PostgreSQL
    participant BC as Hardhat Smart Contract

    Producer->>FE: Tạo lô hàng mới (batch_code, ngày SX, HSD, sản lượng)
    FE->>BE: POST /api/v1/batches
    BE->>BE: Tính mã SHA-256 dữ liệu lô (Canonical JSON Hashing)
    BE->>BC: Gửi giao dịch `registerBatch(batchCode, dataHash, producerAddress)`
    BC-->>BE: Trả về Transaction Hash (txHash) & Block Number
    BE->>DB: Lưu lô hàng kèm txHash và trạng thái COMMITTED
    BE-->>FE: Trả về kết quả + Link QR Code
    FE-->>Producer: Hiển thị mã QR để in tem truy xuất
```

### 3.2. Luồng Người tiêu dùng Quét QR & Kiểm tra Tính Toàn vẹn (Integrity Verification)
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant QR as QR Scanner
    participant FE as Trang Tra cứu
    participant BE as Backend Spring Boot
    participant DB as PostgreSQL
    participant BC as Hardhat Smart Contract

    Customer->>QR: Quét mã QR trên tem sản phẩm
    QR->>FE: Mở URL /trace/{batchCode}
    FE->>BE: GET /api/v1/trace/{batchCode}/verify
    BE->>DB: Truy vấn dữ liệu thực tế hiện tại của Lô hàng trong DB
    BE->>BE: Tính lại SHA-256 hash của dữ liệu vừa đọc được
    BE->>BC: Gọi hàm `getBatchHash(batchCode)` trên Smart Contract
    BC-->>BE: Trả về Hash nguyên bản đã ghi nhận trên chuỗi
    BE->>BE: So sánh `calculatedHash` == `blockchainHash`
    alt Khớp mã Hash
        BE-->>FE: Kết quả: HỢP LỆ (Dữ liệu nguyên bản, không bị sửa đổi)
    else Không khớp mã Hash
        BE-->>FE: Cảnh báo: DỮ LIỆU ĐÃ BỊ THAY ĐỔI TRÁI PHÉP
    end
    FE-->>Customer: Hiển thị biểu đồ Timeline + Huy hiệu xác minh Blockchain
```

---

## 4. Quản lý Môi trường & Biến Cấu hình

Tất cả cấu hình quan trọng (database credentials, JWT secret, cổng dịch vụ) được quản lý qua biến môi trường hoặc file `application.yml`:
- Không commit private key thực hoặc mật khẩu nhạy cảm lên Git public.
- Môi trường phát triển cục bộ (Local Development) được tối ưu để chỉ cần chạy lệnh là có thể hoạt động mà không phụ thuộc hạ tầng đám mây tốn phí.
