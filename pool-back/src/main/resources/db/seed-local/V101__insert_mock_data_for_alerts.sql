-- CHÚ Ý: Đảm bảo bảng của bạn dùng kiểu UUID chuẩn PostgreSQL cho id
-- Dữ liệu giả lập (Mock Data) để Test Alert & Cronjob

-- 1. Tạo 1 Học viên
INSERT INTO students (id, full_name, phone_number, source_type, dob, created_at, updated_at)
VALUES ('c4b4a682-1111-4444-8888-abcdefabcdef', 'Học viên Test Alert',
        '0988888888', 'POOL', '2010-01-01', NOW(), NOW())
    ON CONFLICT DO NOTHING;

-- 2. CASE 1: KHÓA HỌC ĐÃ HẾT HẠN (Để test Cronjob 0h00)
-- expire_date = '2026-08-05' (Ngày hôm qua) -> Status đang là ACTIVE
INSERT INTO enrollments (id, student_id, swim_style, is_guaranteed, start_date, expire_date, total_quota, status, created_at, updated_at)
VALUES ('e1111111-2222-3333-4444-555555555555', 'c4b4a682-1111-4444-8888-abcdefabcdef',
        'FREE', false, '2026-06-20', '2026-08-05', 12, 'ACTIVE', NOW(), NOW());

-- 3. CASE 2: KHÓA HỌC SẮP HẾT HẠN (Còn < 5 ngày - Để test API Alert)
-- expire_date = '2026-08-10' (Còn 3 ngày nữa)
INSERT INTO enrollments (id, student_id, swim_style, is_guaranteed, start_date, expire_date, total_quota, status, created_at, updated_at)
VALUES ('e2222222-2222-3333-4444-555555555555', 'c4b4a682-1111-4444-8888-abcdefabcdef',
        'FROG', true, '2026-06-25', '2026-08-10', 12, 'ACTIVE', NOW(), NOW());

-- 4. CASE 3: KHÓA HỌC LƯỜI HỌC (Quá 7 ngày chưa đến - Để test API Alert)
-- start_date = '2026-07-20' -> Bị lọt vào Rule COALESCE (Do chưa điểm danh lần nào)
INSERT INTO enrollments (id, student_id, swim_style, is_guaranteed, start_date, expire_date, total_quota, status, created_at, updated_at)
VALUES ('e3333333-2222-3333-4444-555555555555', 'c4b4a682-1111-4444-8888-abcdefabcdef', 'BACK',
 false, '2026-07-20', '2026-09-05', 12, 'ACTIVE', NOW(), NOW());

-- 5. GÁN GIÁO VIÊN CHO CÁC KHÓA HỌC NÀY
-- Chọn giáo viên 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' (Nguyễn Giáo An - Seeded in V3)
INSERT INTO enrollment_teachers (enrollment_id, teacher_id)
VALUES 
('e1111111-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('e2222222-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('e3333333-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- 6. THÊM DỮ LIỆU ĐIỂM DANH CHO CASE 1 VÀ CASE 2
-- Để Case 1 và Case 2 không bị coi là "Lười học" (ABSENT), ta cho họ đi học gần đây (cách đây 2-3 ngày)
INSERT INTO attendance_records (id, enrollment_id, shift_id, teacher_id, attend_date, note, created_at, updated_at)
VALUES 
-- Case 1 đi học ngày 04/08/2026
(gen_random_uuid(), 'e1111111-2222-3333-4444-555555555555', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-08-04', 'Có mặt', NOW(), NOW()),
-- Case 2 đi học ngày 05/08/2026
(gen_random_uuid(), 'e2222222-2222-3333-4444-555555555555', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-08-05', 'Có mặt', NOW(), NOW());