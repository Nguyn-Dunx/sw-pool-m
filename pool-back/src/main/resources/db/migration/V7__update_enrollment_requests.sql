-- ======================================================================
-- Nâng cấp bảng enrollment_requests: Hỗ trợ UPDATE request và Custom config
-- ======================================================================

ALTER TABLE enrollment_requests
    ADD COLUMN request_type VARCHAR(20) DEFAULT 'CREATE' CHECK (request_type IN ('CREATE', 'UPDATE')),
    ADD COLUMN target_enrollment_id UUID REFERENCES enrollments(id),
    ADD COLUMN total_quota INT,
    ADD COLUMN start_date DATE,
    ADD COLUMN expire_date DATE;
