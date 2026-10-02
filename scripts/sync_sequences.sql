-- Đồng bộ chuỗi tăng tự động (Sequences) trong PostgreSQL sau khi nạp dữ liệu mẫu
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE(max(id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('locations', 'id'), COALESCE(max(id), 1)) FROM locations;
SELECT setval(pg_get_serial_sequence('producers', 'id'), COALESCE(max(id), 1)) FROM producers;
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(max(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('ocop_certificates', 'id'), COALESCE(max(id), 1)) FROM ocop_certificates;
SELECT setval(pg_get_serial_sequence('production_batches', 'id'), COALESCE(max(id), 1)) FROM production_batches;
SELECT setval(pg_get_serial_sequence('production_events', 'id'), COALESCE(max(id), 1)) FROM production_events;
