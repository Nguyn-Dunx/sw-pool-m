ALTER TABLE enrollments
    ADD COLUMN payment_status VARCHAR(20) DEFAULT 'UNKNOWN' NOT NULL;

ALTER TABLE enrollments
    ADD CONSTRAINT chk_enrollments_payment_status
        CHECK (payment_status IN ('UNKNOWN', 'UNPAID', 'PAID'));

ALTER TABLE enrollments
    ALTER COLUMN payment_status SET DEFAULT 'UNPAID';
