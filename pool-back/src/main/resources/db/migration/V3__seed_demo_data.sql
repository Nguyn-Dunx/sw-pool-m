-- ==========================
-- Teachers
-- ==========================

INSERT INTO teachers
(
    id,
    user_id,
    full_name,
    specialty
)
VALUES

(
'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'22222222-2222-2222-2222-222222222222',
'Nguyễn Giáo An',
'Freestyle'
),

(
'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'33333333-3333-3333-3333-333333333333',
'Trần Giáo Bình',
'Breaststroke'
);

-- ==========================
-- Students
-- ==========================

INSERT INTO students
(
id,
full_name,
dob,
phone_number
)
VALUES

(
'10000000-0000-0000-0000-000000000001',
'Nguyễn Sinh A',
'2014-05-12',
'0911111111'
),

(
'10000000-0000-0000-0000-000000000002',
'Trần Sinh B',
'2015-07-20',
'0922222222'
),

(
'10000000-0000-0000-0000-000000000003',
'Lê Sinh C',
'2013-11-02',
'0933333333'
);

-- ==========================
-- Enrollments
-- ==========================

INSERT INTO enrollments
(
id,
student_id,
swim_style,
start_date,
expire_date,
total_quota
)
VALUES

(
'20000000-0000-0000-0000-000000000001',
'10000000-0000-0000-0000-000000000001',
'FREE',
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 day',
12
),

(
'20000000-0000-0000-0000-000000000002',
'10000000-0000-0000-0000-000000000002',
'FROG',
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 day',
12
),

(
'20000000-0000-0000-0000-000000000003',
'10000000-0000-0000-0000-000000000003',
'BACK',
CURRENT_DATE,
CURRENT_DATE + INTERVAL '30 day',
12
);

-- ==========================
-- Teacher Assignment
-- ==========================

INSERT INTO enrollment_teachers
(
enrollment_id,
teacher_id
)
VALUES

(
'20000000-0000-0000-0000-000000000001',
'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
),

(
'20000000-0000-0000-0000-000000000002',
'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
),

(
'20000000-0000-0000-0000-000000000003',
'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

-- ==========================
-- Shifts
-- ==========================

INSERT INTO shifts(start_time, end_time, period)
VALUES
('06:00', '07:00', 'MORNING'),
('07:00', '08:00', 'MORNING'),
('08:00', '09:00', 'MORNING'),
('09:00', '10:00', 'MORNING'),


('14:00', '15:00', 'AFTERNOON'),
('15:00', '16:00', 'AFTERNOON'),
('16:00', '17:00', 'AFTERNOON'),
('17:00', '18:00', 'AFTERNOON');

-- ==========================
-- Attendance
-- ==========================

INSERT INTO attendance_records
(
id,
enrollment_id,
shift_id,
teacher_id,
attend_date,
note
)
VALUES

(
'30000000-0000-0000-0000-000000000001',
'20000000-0000-0000-0000-000000000001',
1,
'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
CURRENT_DATE,
'Present'
),

(
'30000000-0000-0000-0000-000000000002',
'20000000-0000-0000-0000-000000000002',
1,
'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
CURRENT_DATE,
'Present'
),

(
'30000000-0000-0000-0000-000000000003',
'20000000-0000-0000-0000-000000000003',
2,
'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
CURRENT_DATE,
'Present'
);