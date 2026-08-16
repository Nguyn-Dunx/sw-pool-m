package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.enums.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, UUID> {

    @Query("SELECT r FROM EnrollmentRequest r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:requestType IS NULL OR r.requestType = :requestType) AND " +
           "(:swimStyle IS NULL OR r.swimStyle = :swimStyle) AND " +
           "(:isGuaranteed IS NULL OR r.isGuaranteed = :isGuaranteed) AND " +
           "LOWER(r.student.fullName) LIKE LOWER(CONCAT('%', COALESCE(:studentName, ''), '%')) " +
           "ORDER BY r.createdAt DESC")
    Page<EnrollmentRequest> findByAdminFilters(
            @Param("status") RequestStatus status,
            @Param("requestType") RequestType requestType,
            @Param("swimStyle") SwimStyle swimStyle,
            @Param("isGuaranteed") Boolean isGuaranteed,
            @Param("studentName") String studentName,
            Pageable pageable);

    @Query("SELECT r FROM EnrollmentRequest r WHERE " +
           "r.teacher.id = :teacherId AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:requestType IS NULL OR r.requestType = :requestType) " +
           "ORDER BY r.createdAt DESC")
    Page<EnrollmentRequest> findByTeacherIdAndFilters(
            @Param("teacherId") UUID teacherId,
            @Param("status") RequestStatus status,
            @Param("requestType") RequestType requestType,
            Pageable pageable);

    @Query("SELECT r FROM EnrollmentRequest r JOIN FETCH r.student JOIN FETCH r.teacher WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:requestType IS NULL OR r.requestType = :requestType) AND " +
           "(:swimStyle IS NULL OR r.swimStyle = :swimStyle) AND " +
           "(:isGuaranteed IS NULL OR r.isGuaranteed = :isGuaranteed) AND " +
           "LOWER(r.student.fullName) LIKE LOWER(CONCAT('%', COALESCE(:studentName, ''), '%')) " +
           "ORDER BY r.createdAt DESC")
    java.util.List<EnrollmentRequest> exportAdminRequests(
            @Param("status") RequestStatus status,
            @Param("requestType") RequestType requestType,
            @Param("swimStyle") SwimStyle swimStyle,
            @Param("isGuaranteed") Boolean isGuaranteed,
            @Param("studentName") String studentName);

    @Query("SELECT r FROM EnrollmentRequest r JOIN FETCH r.student WHERE " +
           "r.teacher.id = :teacherId AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:requestType IS NULL OR r.requestType = :requestType) " +
           "ORDER BY r.createdAt DESC")
    java.util.List<EnrollmentRequest> exportTeacherRequests(
            @Param("teacherId") UUID teacherId,
            @Param("status") RequestStatus status,
            @Param("requestType") RequestType requestType);

    boolean existsByStudentIdAndSwimStyleAndStatusIn(UUID studentId, SwimStyle swimStyle, Collection<RequestStatus> statuses);

    boolean existsByTargetEnrollmentIdAndStatusIn(UUID targetEnrollmentId, Collection<RequestStatus> statuses);
}
