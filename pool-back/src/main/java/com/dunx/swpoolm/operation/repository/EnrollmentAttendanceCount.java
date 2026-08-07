package com.dunx.swpoolm.operation.repository;

import java.util.UUID;

// Đây là DTO ảo của JPA, help map kết quả của câu query GROUP BY
public interface EnrollmentAttendanceCount {
    UUID getEnrollmentId();
    Long getSessionCount();
}