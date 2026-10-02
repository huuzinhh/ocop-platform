-- ====================================================================
-- SCHEMA CƠ SỞ DỮ LIỆU NỀN TẢNG OCOP VIỆT NAM (PostgreSQL 15+)
-- ====================================================================

-- 1. Phân quyền và Người dùng
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 2. Địa lý (GIS) & Nhà sản xuất
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    ward VARCHAR(100),
    address_detail VARCHAR(255),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL
);

CREATE TABLE IF NOT EXISTS producers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    contact_email VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(150),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Danh mục & Sản phẩm OCOP
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    producer_id BIGINT NOT NULL REFERENCES producers(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    cultural_story TEXT,
    price NUMERIC(12, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'Hộp',
    ocop_star_rating SMALLINT NOT NULL CHECK (ocop_star_rating BETWEEN 3 AND 5),
    thumbnail VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ocop_certificates (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    certificate_code VARCHAR(50) NOT NULL,
    star_rating SMALLINT NOT NULL CHECK (star_rating BETWEEN 3 AND 5),
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issuing_authority VARCHAR(150) NOT NULL,
    document_url VARCHAR(255),
    is_sample_data BOOLEAN DEFAULT TRUE
);

-- 4. Lô sản xuất & Chuỗi cung ứng Blockchain
CREATE TABLE IF NOT EXISTS production_batches (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL,
    qr_code_url VARCHAR(255),
    raw_data_hash VARCHAR(66) NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    blockchain_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_events (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    event_name VARCHAR(150) NOT NULL,
    description TEXT,
    actor_name VARCHAR(100) NOT NULL,
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    event_timestamp TIMESTAMP NOT NULL,
    raw_data_hash VARCHAR(66) NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Thương mại điện tử: Giỏ hàng, Đơn hàng & Thanh toán mô phỏng
CREATE TABLE IF NOT EXISTS carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(30) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL,
    shipping_fee NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    shipping_address TEXT NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    batch_id BIGINT REFERENCES production_batches(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    transaction_ref VARCHAR(100),
    payment_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_code VARCHAR(50) UNIQUE,
    carrier_name VARCHAR(100) DEFAULT 'Giao Hàng Tiết Kiệm (Demo)',
    status VARCHAR(20) DEFAULT 'PREPARING',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
