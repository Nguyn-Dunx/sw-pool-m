package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    // for progress bar UI (eg: 8/12)
    long countByEnrollmentId(UUID enrollmentId);

    boolean existsByEnrollmentIdAndShiftIdAndAttendDate(UUID enrollmentId, Integer shiftId, LocalDate attendDate);

    // 1. Lấy danh sách đếm số buổi của nhiều Enrollment CÙNG MỘT LÚC (Chống N+1 Query)
    @Query("SELECT a.enrollment.id AS enrollmentId, COUNT(a) AS sessionCount " +
            "FROM AttendanceRecord a WHERE a.enrollment.id IN :enrollmentIds GROUP BY a.enrollment.id")
    List<EnrollmentAttendanceCount> countAttendancesForEnrollments(@Param("enrollmentIds") List<UUID> enrollmentIds);


    List<AttendanceRecord> findByEnrollmentIdOrderByAttendDateDesc(UUID enrollmentId);

    @Query("SELECT MAX(a.attendDate) FROM AttendanceRecord a WHERE a.enrollment.id = :enrollmentId")
    LocalDate findLastAttendDateByEnrollmentId(@Param("enrollmentId") UUID enrollmentId);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.teacher.id = :teacherId AND a.attendDate BETWEEN :startDate AND :endDate")
    long countByTeacherIdAndAttendDateBetween(@Param("teacherId") UUID teacherId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}