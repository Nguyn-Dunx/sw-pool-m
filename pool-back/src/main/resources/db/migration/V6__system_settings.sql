-- =============================================
-- Bảng cấu hình hệ thống (System Settings)
-- =============================================
CREATE TABLE system_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description   TEXT,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed dữ liệu mặc định (Business Rules)
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
('enrollment.duration-days',      '45',  'Thời hạn khóa học mặc định (ngày)'),
('enrollment.default-quota',      '12',  'Số buổi học mặc định'),
('alert.expire-threshold-days',   '5',   'Cảnh báo trước khi hết hạn (ngày)'),
('alert.absent-threshold-days',   '7',   'Cảnh báo vắng mặt nếu nghỉ quá N ngày');
