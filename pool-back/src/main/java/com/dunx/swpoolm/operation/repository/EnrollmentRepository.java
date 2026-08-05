package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    @Query("SELECT e FROM Enrollment e JOIN e.teachers t WHERE t.id = :teacherId AND e.status = :status")
    List<Enrollment> findByTeacherIdAndStatus(@Param("teacherId") UUID teacherId, @Param("status") EnrollmentStatus status);

    @Query("SELECT e FROM Enrollment e WHERE e.status = 'ACTIVE' AND e.expireDate <= :warningDate")
    List<Enrollment> findExpiringEnrollments(@Param("warningDate") LocalDate warningDate);

    List<Enrollment> findByStatusAndExpireDateBefore(EnrollmentStatus status, LocalDate date);

    boolean existsByStudentIdAndSwimStyleAndStatus(UUID studentId, SwimStyle swimStyle, EnrollmentStatus status);
}