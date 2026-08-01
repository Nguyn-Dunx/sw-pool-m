package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    // for progress bar UI (eg: 8/12)
    long countByEnrollmentId(UUID enrollmentId);

    boolean existsByEnrollmentIdAndShiftIdAndAttendDate(UUID enrollmentId, Integer shiftId, LocalDate attendDate);
}