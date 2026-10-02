-- Script cập nhật BCrypt hash đúng cho mật khẩu '123456'
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE id IN (1, 2, 3);

SELECT id, username, LEFT(password_hash, 25) AS hash_preview, status FROM users;
