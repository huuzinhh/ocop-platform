-- Cấp quyền ROLE_PRODUCER và ROLE_ADMIN cho tài khoản huuzinhh (id = 5)
INSERT INTO user_roles (user_id, role_id) VALUES (5, 2) ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id) VALUES (5, 3) ON CONFLICT DO NOTHING;

SELECT u.id, u.username, u.full_name, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.id = 5;
