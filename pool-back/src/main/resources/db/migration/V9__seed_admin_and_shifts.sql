-- ======================================================================
-- V9: Seed Admin User & Default Shifts
-- ======================================================================

-- 1. Tạo tài khoản Admin mặc định
-- SĐT: 0968686868
-- Mật khẩu: Admin@69 (BCrypt hash)
INSERT INTO users (id, phone_number, password_hash, role_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    '0968686868',
    '$2a$10$6kECYO0blUnVRheD10lWxuXg/zJvsKJtpCS3SZm3o2vQMTZ06NEFS',
    1, -- ROLE_ADMIN
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE phone_number = '0968686868'
);

-- 2. Tạo các ca học tiêu chuẩn (Shifts) nếu chưa có
INSERT INTO shifts (start_time, end_time, period)
SELECT '06:00:00', '07:00:00', 'MORNING'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '06:00:00' AND end_time = '07:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '07:00:00', '08:00:00', 'MORNING'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '07:00:00' AND end_time = '08:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '08:00:00', '09:00:00', 'MORNING'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '08:00:00' AND end_time = '09:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '14:00:00', '15:00:00', 'AFTERNOON'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '14:00:00' AND end_time = '15:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '15:00:00', '16:00:00', 'AFTERNOON'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '15:00:00' AND end_time = '16:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '16:00:00', '17:00:00', 'AFTERNOON'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '16:00:00' AND end_time = '17:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '17:00:00', '18:00:00', 'AFTERNOON'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '17:00:00' AND end_time = '18:00:00');

INSERT INTO shifts (start_time, end_time, period)
SELECT '18:00:00', '19:00:00', 'AFTERNOON'
WHERE NOT EXISTS (SELECT 1 FROM shifts WHERE start_time = '18:00:00' AND end_time = '19:00:00');
