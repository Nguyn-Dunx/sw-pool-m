package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    long countByStatus(EnrollmentStatus status);
    
    long countByCreatedAtBetween(java.time.Instant start, java.time.Instant end);

    long countByTeachers_IdAndStatus(UUID teacherId, EnrollmentStatus status);

    boolean existsByStudentIdAndSwimStyleAndStatus(UUID studentId, SwimStyle swimStyle, EnrollmentStatus status);

    @Query("SELECT e FROM Enrollment e JOIN e.teachers t WHERE t.id = :teacherId " +
           "AND (:status IS NULL OR e.status = :status) " +
           "AND (:swimStyle IS NULL OR e.swimStyle = :swimStyle) " +
           "AND (:isGuaranteed IS NULL OR e.isGuaranteed = :isGuaranteed) " +
           "AND (:studentName IS NULL OR LOWER(e.student.fullName) LIKE LOWER(CONCAT('%', :studentName, '%'))) " +
           "ORDER BY e.startDate DESC")
    Page<Enrollment> findEnrollmentsByTeacherWithFilters(
            @Param("teacherId") UUID teacherId,
            @Param("status") EnrollmentStatus status,
            @Param("swimStyle") SwimStyle swimStyle,
            @Param("isGuaranteed") Boolean isGuaranteed,
            @Param("studentName") String studentName,
            Pageable pageable
    );
    // for Cronjob
    // Chỉ expire enrollment KHÔNG cam kết (isGuaranteed = false).
    // Enrollment có cam kết (isGuaranteed = true) được học bù không giới hạn thời gian,
    // nên không tự động hết hạn — Admin phải đóng thủ công khi thấy phù hợp.
    @Modifying
    @Query("UPDATE Enrollment e SET e.status = 'EXPIRED' " +
            "WHERE e.status = 'ACTIVE' AND e.isGuaranteed = false AND e.expireDate < :today")
    int autoExpireEnrollments(@Param("today") LocalDate today);

    //admin
    //  Dành cho Cảnh báo: Lấy danh sách sắp hết hạn (còn <= 5 ngày)
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student JOIN FETCH e.teachers " +
            "WHERE e.status = 'ACTIVE' AND e.expireDate BETWEEN :today AND :thresholdDate " +
            "ORDER BY e.expireDate ASC")
    List<Enrollment> findExpiringSoonEnrollments(@Param("today") LocalDate today, @Param("thresholdDate") LocalDate thresholdDate);

    //  Dành cho Cảnh báo: Lấy danh sách lười học (Quá 7 ngày chưa đi học)
    // Logic: Khóa đang ACTIVE, và ngày điểm danh cuối cùng cách đây > 7 ngày

    @Query(value = """
    SELECT e.*
    FROM enrollments e
    LEFT JOIN attendance_records a
           ON a.enrollment_id = e.id
          AND a.deleted_at IS NULL
    WHERE e.status = 'ACTIVE'
      AND e.deleted_at IS NULL
    GROUP BY e.id
    HAVING COALESCE(MAX(a.attend_date), e.start_date) <= :thresholdDate
    """, nativeQuery = true)
    List<Enrollment> findAbsentEnrollments(@Param("thresholdDate") LocalDate thresholdDate);

    // teacher
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student JOIN e.teachers t " +
            "WHERE t.id = :teacherId AND e.status = 'ACTIVE' AND e.expireDate BETWEEN :today AND :thresholdDate " +
            "ORDER BY e.expireDate ASC")
    List<Enrollment> findExpiringSoonEnrollmentsByTeacher(
            @Param("teacherId") UUID teacherId,
            @Param("today") LocalDate today,
            @Param("thresholdDate") LocalDate thresholdDate);

    // 2. Quét lười học (Lọc theo Teacher - Dùng Native Query JOIN bảng trung gian)
    @Query(value = """
    SELECT e.*
    FROM enrollments e
    INNER JOIN enrollment_teachers et
           ON e.id = et.enrollment_id
    WHERE et.teacher_id = :teacherId
      AND e.status = 'ACTIVE'
      AND e.deleted_at IS NULL
      AND COALESCE(
          (
              SELECT MAX(a.attend_date)
              FROM attendance_records a
              WHERE a.enrollment_id = e.id
                AND a.deleted_at IS NULL
          ),
          e.start_date
      ) <= :thresholdDate
""",
            nativeQuery = true)
    List<Enrollment> findAbsentEnrollmentsByTeacher(
            @Param("teacherId") UUID teacherId,
            @Param("thresholdDate") LocalDate thresholdDate);

    // Admin: Danh sách Enrollment phân trang, filter nhiều tiêu chí
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student " +
            "WHERE (:status IS NULL OR e.status = :status) " +
            "AND (:swimStyle IS NULL OR e.swimStyle = :swimStyle) " +
            "AND (:studentName IS NULL OR LOWER(e.student.fullName) LIKE LOWER(CONCAT('%', :studentName, '%'))) " +
            "ORDER BY e.createdAt DESC")
    Page<Enrollment> findAllWithFilters(
            @Param("status") EnrollmentStatus status,
            @Param("swimStyle") SwimStyle swimStyle,
            @Param("studentName") String studentName,
            Pageable pageable);

    // Admin: Danh sách Enrollment filter theo teacherId
    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student JOIN e.teachers t " +
            "WHERE t.id = :teacherId " +
            "AND (:status IS NULL OR e.status = :status) " +
            "ORDER BY e.createdAt DESC")
    Page<Enrollment> findAllByTeacherWithFilters(
            @Param("teacherId") UUID teacherId,
            @Param("status") EnrollmentStatus status,
            Pageable pageable);

}