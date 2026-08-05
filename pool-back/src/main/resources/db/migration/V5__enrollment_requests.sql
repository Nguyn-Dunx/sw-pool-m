-- ==========================
-- Bảng yêu cầu đăng ký khóa học (Teacher gửi, Admin duyệt)
-- ==========================

CREATE TABLE enrollment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    swim_style VARCHAR(20) NOT NULL CHECK (swim_style IN ('FROG', 'FREE', 'BACK', 'FLY')),
    is_guaranteed BOOLEAN DEFAULT FALSE,
    note TEXT,
    admin_note TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    CONSTRAINT fk_er_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_er_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);
