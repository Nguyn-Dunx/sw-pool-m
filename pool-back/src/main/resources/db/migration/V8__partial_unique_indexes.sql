-- ======================================================================
-- V8: Partial unique index cho soft-delete
-- ======================================================================
-- Vấn đề: bảng users có UNIQUE constraint trên phone_number, nhưng soft delete
-- chỉ set deleted_at = CURRENT_TIMESTAMP (không xóa row). Nếu xóa user rồi tạo
-- lại cùng SĐT → lỗi duplicate key.
--
-- Giải pháp: thay UNIQUE constraint bằng partial unique index chỉ áp dụng cho
-- row chưa bị xóa (deleted_at IS NULL). Cho phép tạo lại SĐT sau khi soft delete.
-- ======================================================================

-- 1. users.phone_number
ALTER TABLE users DROP CONSTRAINT users_phone_number_key;
CREATE UNIQUE INDEX users_phone_number_active_unique
    ON users (phone_number)
    WHERE deleted_at IS NULL;

-- 2. students.phone_number (nullable — chỉ unique khi có giá trị và chưa xóa)
-- CREATE UNIQUE INDEX students_phone_number_active_unique
--     ON students (phone_number)
--     WHERE phone_number IS NOT NULL AND deleted_at IS NULL;
-- HIỆN TẠI KO DÙNG VÌ STUDENT CÓ THỂ DÙNG CHUNG SDT PHỤ HUYNH

-- 3. teachers.user_id (quan hệ 1-1 — partial unique khi chưa xóa)
-- teachers hiện không có unique constraint tường minh trên user_id ngoài UNIQUE trong schema,
-- nhưng để an toàn cho soft delete:
CREATE UNIQUE INDEX teachers_user_id_active_unique
    ON teachers (user_id)
    WHERE deleted_at IS NULL;
