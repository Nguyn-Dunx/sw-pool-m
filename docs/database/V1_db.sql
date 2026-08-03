CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL, -- VD: 'ADMIN', 'TEACHER', 'CASHIER'
    description TEXT                      -- Mô tả: 'Quản trị viên', 'Giáo viên'...
);

-- Insert sẵn các quyền cơ bản
-- INSERT INTO roles (role_name, description) VALUES ('ROLE_ADMIN', 'Quản trị viên toàn hệ thống');
-- INSERT INTO roles (role_name, description) VALUES ('ROLE_TEACHER', 'Giáo viên dạy bơi');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Dùng gen_random_uuid() của PostgreSQL (từ bản 13+)
    phone_number VARCHAR(15) UNIQUE NOT NULL,      -- Dùng làm Username đăng nhập
    password_hash VARCHAR(255) NOT NULL,           -- Lưu mật khẩu đã mã hóa (bcrypt/argon2)
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,                -- Khóa tài khoản nếu cần
    last_login TIMESTAMP,                          -- Theo dõi lần cuối đăng nhập
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Dùng RESTRICT: Ngăn chặn việc lỡ tay xóa mất 1 Role trong bảng roles nếu đang có user sử dụng role đó
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,                  -- Khóa ngoại trỏ tới users. UNIQUE đảm bảo quan hệ 1-1
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),                        -- Chuyên môn (VD: Dạy bơi ếch, bơi sải)
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    CONSTRAINT fk_teacher_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    dob DATE,
    phone_number VARCHAR(15), -- Có thể NULL vì học sinh nhỏ tuổi dùng SĐT phụ huynh
    source_type VARCHAR(20) DEFAULT 'POOL' CHECK (source_type IN ('POOL', 'TEACHER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    swim_style VARCHAR(20) NOT NULL CHECK (swim_style IN ('FROG', 'FREE', 'BACK', 'FLY')),
    is_guaranteed BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    expire_date DATE NOT NULL,
    total_quota INT DEFAULT 12,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'EXPIRED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    CHECK (expire_date >= start_date),
    CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE enrollment_teachers (
    enrollment_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    assigned_date DATE DEFAULT CURRENT_DATE,
    
    PRIMARY KEY (enrollment_id, teacher_id), -- Đảm bảo không trùng lặp
    CONSTRAINT fk_et_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_et_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period VARCHAR(10) NOT NULL CHECK (period IN ('MORNING', 'AFTERNOON'))
);

-- Bạn có thể insert sẵn data mẫu cho bể bơi:
-- INSERT INTO shifts (start_time, end_time, period) VALUES ('06:00:00', '07:00:00', 'MORNING');
-- INSERT INTO shifts (start_time, end_time, period) VALUES ('14:00:00', '15:00:00', 'AFTERNOON');

--// diem danh
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL,
    shift_id INT NOT NULL,
    teacher_id UUID, -- Thầy nào thực hiện việc check-in buổi đó
    attend_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    UNIQUE(enrollment_id, shift_id, attend_date),
    CONSTRAINT fk_attendance_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_shift FOREIGN KEY (shift_id) REFERENCES shifts(id),
    CONSTRAINT fk_attendance_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- Bảng lưu trữ token cho tính năng Remember Me của Spring Security
CREATE TABLE persistent_logins (
    username VARCHAR(64) NOT NULL,
    series VARCHAR(64) PRIMARY KEY,
    token VARCHAR(64) NOT NULL,
    last_used TIMESTAMP NOT NULL
);