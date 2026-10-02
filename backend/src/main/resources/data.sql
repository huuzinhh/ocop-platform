-- ====================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA) NỀN TẢNG OCOP VIỆT NAM
-- ====================================================================

-- 1. Roles
INSERT INTO roles (id, name) VALUES 
(1, 'ROLE_CUSTOMER'),
(2, 'ROLE_PRODUCER'),
(3, 'ROLE_ADMIN')
ON CONFLICT (id) DO NOTHING;

-- 2. Users (Mật khẩu mặc định là: 123456)
-- BCrypt hash thực của '123456': $2a$10$KNYE2QbDpGX7Hx.eUEHhBu5idp6UdyHrxGOQ0ZqDWgFqpH7HtWoOO
INSERT INTO users (id, username, email, password_hash, full_name, phone, status) VALUES
(1, 'admin', 'admin@ocop.vn', '$2a$10$KNYE2QbDpGX7Hx.eUEHhBu5idp6UdyHrxGOQ0ZqDWgFqpH7HtWoOO', 'Quản trị viên Hệ thống OCOP', '0901234567', 'ACTIVE'),
(2, 'producer_finho', 'finho@ocop.vn', '$2a$10$KNYE2QbDpGX7Hx.eUEHhBu5idp6UdyHrxGOQ0ZqDWgFqpH7HtWoOO', 'HTX Chè Shan Tuyết Fìn Hò', '0987654321', 'ACTIVE'),
(3, 'customer_demo', 'customer@ocop.vn', '$2a$10$KNYE2QbDpGX7Hx.eUEHhBu5idp6UdyHrxGOQ0ZqDWgFqpH7HtWoOO', 'Nguyễn Văn Người Dùng', '0912345678', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 3), -- admin -> ROLE_ADMIN
(2, 2), -- producer -> ROLE_PRODUCER
(3, 1)  -- customer -> ROLE_CUSTOMER
ON CONFLICT DO NOTHING;

-- 3. Tọa độ Địa lý (GIS Locations)
INSERT INTO locations (id, province, district, ward, address_detail, latitude, longitude) VALUES
(1, 'Hà Giang', 'Hoàng Su Phì', 'Thông Nguyên', 'Thôn Làng Giang, Xã Thông Nguyên', 22.6183420, 104.7563140),
(2, 'Bến Tre', 'Giồng Trôm', 'Châu Hòa', 'Ấp Thới Hòa, Xã Châu Hòa', 10.2458310, 106.4952710),
(3, 'Sơn La', 'Mộc Châu', 'Đông Sang', 'Bản Áng, Xã Đông Sang', 20.8256190, 104.6642180),
(4, 'Quảng Nam', 'Nam Trà My', 'Trà Mai', 'Thôn 1, Xã Trà Mai', 15.1235120, 108.0823410)
ON CONFLICT (id) DO NOTHING;

-- 4. Nhà sản xuất OCOP (Producers)
INSERT INTO producers (id, user_id, name, code, description, location_id, contact_email, phone, is_verified) VALUES
(1, 2, 'Hợp tác xã Chè Shan Tuyết Fìn Hò', 'PROD-HG-FINHO', 'Chuyên canh tác và chế biến chè Shan Tuyết cổ thụ hàng trăm năm tuổi tại vùng núi cao Hoàng Su Phì, tỉnh Hà Giang.', 1, 'contact@finhotea.vn', '0987654321', TRUE),
(2, NULL, 'Hợp tác xã Bưởi Da Xanh Giồng Trôm', 'PROD-BT-GIONGTROM', 'Cung cấp bưởi Da Xanh VietGAP đạt chuẩn OCOP 4 sao tỉnh Bến Tre, vị ngọt thanh mát, tép bưởi mọng nước.', 2, 'buoidaxanh@bentre.vn', '0912888999', TRUE),
(3, NULL, 'HTX Nông nghiệp Hữu cơ Mộc Châu', 'PROD-SL-MOCCHAU', 'Sản xuất dâu tây hữu cơ và mận hậu Mộc Châu theo tiêu chuẩn hữu cơ tự nhiên vùng cao Tây Bắc.', 3, 'mocchauorganic@sonla.vn', '0945678123', TRUE),
(4, NULL, 'Công ty TNHH Sâm Ngọc Linh Nam Trà My', 'PROD-QN-SAMNGOCLINH', 'Bảo tồn và phát triển các sản phẩm từ Quốc bảo Sâm Ngọc Linh trên đỉnh núi Ngọc Linh hùng vĩ.', 4, 'samngoclinh@quangnam.vn', '0933222111', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Danh mục Sản phẩm (Categories)
INSERT INTO categories (id, name, slug, description, icon_url) VALUES
(1, 'Trà & Đồ uống Thảo mộc', 'tra-do-uong', 'Các dòng trà đặc sản, trà cổ thụ và nước uống thảo mộc thiên nhiên', 'icon-tea'),
(2, 'Trái cây & Nông sản tươi', 'trai-cay-nong-san', 'Hoa quả đặc sản vùng miền đạt tiêu chuẩn an toàn thực phẩm', 'icon-fruit'),
(3, 'Dược liệu & Sức khỏe', 'duoc-lieu-suc-khoe', 'Sâm quý, mật ong rừng và các loại thảo dược quý vùng cao', 'icon-herb'),
(4, 'Gia vị & Chế biến truyền thống', 'gia-vi-truyen-thong', 'Nước mắm truyền thống, hạt tiêu, gia vị đặc trưng bản địa', 'icon-spice')
ON CONFLICT (id) DO NOTHING;

-- 6. Sản phẩm OCOP (Products)
INSERT INTO products (id, producer_id, category_id, name, slug, description, cultural_story, price, stock_quantity, unit, ocop_star_rating, thumbnail, status) VALUES
(1, 1, 1, 'Trà Shan Tuyết Cổ Thụ Fìn Hò (Hộp Cao Cấp 100g)', 'tra-shan-tuyet-co-thu-fin-ho-100g', 
'Thu hoạch từ những cây chè cổ thụ trên 200 năm tuổi tại độ cao trên 1300m so với mực nước biển, búp chè phủ lớp lông tuyết trắng muốt.', 
'Cây chè Shan Tuyết là báu vật truyền đời của đồng bào người Dao đỏ tại Hoàng Su Phì. Từng búp trà thấm đượm sương mù và khí trời Tây Bắc, được sao thủ công bởi những nghệ nhân giàu kinh nghiệm, mang lại hậu vị ngọt sâu lắng.', 
350000, 150, 'Hộp', 5, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500', 'ACTIVE'),

(2, 2, 2, 'Bưởi Da Xanh Bến Tre OCOP 4 Sao (Trái 1.4kg - 1.8kg)', 'buoi-da-xanh-ben-tre-ocop-4-sao', 
'Bưởi da xanh vỏ mỏng, ruột hồng đào, tép bưởi mọng nước không hạt, vị ngọt thanh dịu không chua gắt.', 
'Được phù sa sông Cửu Long bồi đắp quanh năm, bưởi da xanh Giồng Trôm là niềm tự hào của người nông dân xứ Dừa Bến Tre, đạt chuẩn xuất khẩu chất lượng cao.', 
95000, 300, 'Trái', 4, 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=500', 'ACTIVE'),

(3, 4, 3, 'Trà Sâm Ngọc Linh Cao Cấp (Hộp 20 gói túi lọc)', 'tra-sam-ngoc-linh-cao-cap', 
'Chiết xuất từ lá và củ Sâm Ngọc Linh tự nhiên 6 năm tuổi, hỗ trợ tăng cường sức đề kháng và giảm căng thẳng.', 
'Sâm Ngọc Linh được mệnh danh là Quốc bảo Việt Nam, sinh trưởng dưới tán rừng nguyên sinh trên đỉnh núi cao trên 2000m thuộc dãy Trường Sơn.', 
580000, 80, 'Hộp', 5, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500', 'ACTIVE'),

(4, 3, 2, 'Dâu Tây Mộc Châu Chuẩn VietGAP (Hộp 500g)', 'dau-tay-moc-chau-vietgap-500g', 
'Dâu tây giống Hana Nhật Bản trồng tại cao nguyên Mộc Châu, quả đỏ mọng, vị ngọt đậm và thơm ngát.', 
'Khí hậu mát mẻ quanh năm của Mộc Châu kết hợp phương pháp canh tác hữu cơ trong nhà màng tạo nên những trái dâu thơm ngon, an lành cho sức khỏe.', 
140000, 200, 'Hộp', 4, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 7. Chứng nhận OCOP Mẫu (Certificates)
INSERT INTO ocop_certificates (id, product_id, certificate_code, star_rating, issued_date, expiry_date, issuing_authority, is_sample_data) VALUES
(1, 1, 'OCOP-5S-HG-2023-089', 5, '2023-08-15', '2026-08-15', 'Hội đồng đánh giá phân hạng sản phẩm OCOP Quốc gia', TRUE),
(2, 2, 'OCOP-4S-BT-2024-012', 4, '2024-03-20', '2027-03-20', 'UBND Tỉnh Bến Tre', TRUE),
(3, 3, 'OCOP-5S-QN-2023-005', 5, '2023-11-10', '2026-11-10', 'Hội đồng đánh giá phân hạng sản phẩm OCOP Quốc gia', TRUE),
(4, 4, 'OCOP-4S-SL-2024-044', 4, '2024-01-15', '2027-01-15', 'UBND Tỉnh Sơn La', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Lô sản xuất mẫu & Dữ liệu Chuỗi cung ứng (Batches & Events)
INSERT INTO production_batches (id, product_id, batch_code, manufacture_date, expiry_date, quantity, qr_code_url, raw_data_hash, blockchain_tx_hash, blockchain_status) VALUES
(1, 1, 'BATCH-2026-FINHO-01', '2026-09-10', '2028-09-10', 500, 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/trace/BATCH-2026-FINHO-01', 'a35f79a957b7d7f8d6f51cb3e1c6b24d9c79234b15d2903fa5789f2a4128f11a', '0x9b43e981249b6f87d3a2e3794b15a6b0c1e82347d8b5a7c29384b6f1a8e23901', 'COMMITTED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO production_events (id, batch_id, event_type, event_name, description, actor_name, location_id, event_timestamp, raw_data_hash, blockchain_tx_hash) VALUES
(1, 1, 'HARVEST', 'Thu hái chè búp tươi 1 tôm 2 lá', 'Thu hái thủ công từ cây chè Shan Tuyết cổ thụ vào sáng sớm lúc sương chưa tan.', 'Tổ thu hái HTX Fìn Hò', 1, '2026-09-10 06:30:00', '1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f', '0x1111e981249b6f87d3a2e3794b15a6b0c1e82347d8b5a7c29384b6f1a8e23901'),
(2, 1, 'PROCESSING', 'Lên men và sao chè bằng chảo gang', 'Kiểm soát nhiệt độ chảo gang ở 90 độ C, vò cánh chè nhẹ nhàng giữ nguyên tuyết trắng.', 'Nghệ nhân Đặng Văn Nam', 1, '2026-09-10 14:00:00', '2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a', '0x2222e981249b6f87d3a2e3794b15a6b0c1e82347d8b5a7c29384b6f1a8e23902'),
(3, 1, 'PACKAGING', 'Hút chân không & Dán tem truy xuất OCOP', 'Đóng gói vào túi thiếc 100g, hút chân không bảo quản hương vị tự nhiên và dán tem QR.', 'Xưởng đóng gói Fìn Hò', 1, '2026-09-11 09:00:00', '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', '0x3333e981249b6f87d3a2e3794b15a6b0c1e82347d8b5a7c29384b6f1a8e23903')
ON CONFLICT (id) DO NOTHING;

-- 9. Đồng bộ Sequences
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(max(id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('locations', 'id'), COALESCE(max(id), 1)) FROM locations;
SELECT setval(pg_get_serial_sequence('producers', 'id'), COALESCE(max(id), 1)) FROM producers;
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(max(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('ocop_certificates', 'id'), COALESCE(max(id), 1)) FROM ocop_certificates;
SELECT setval(pg_get_serial_sequence('production_batches', 'id'), COALESCE(max(id), 1)) FROM production_batches;
SELECT setval(pg_get_serial_sequence('production_events', 'id'), COALESCE(max(id), 1)) FROM production_events;

