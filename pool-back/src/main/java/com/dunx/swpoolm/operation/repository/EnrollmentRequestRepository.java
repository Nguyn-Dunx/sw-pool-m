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

    // Có thể filter theo requestType (nếu null thì lấy tất cả)
    @Query("SELECT r FROM EnrollmentRequest r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:requestType IS NULL OR r.requestType = :requestType)")
    Page<EnrollmentRequest> findByStatusAndType(
            @Param("status") RequestStatus status,
            @Param("requestType") RequestType requestType,
            Pageable pageable);

    @Query("SELECT r FROM EnrollmentRequest r WHERE " +
           "r.teacher.id = :teacherId AND " +
           "(:requestType IS NULL OR r.requestType = :requestType)")
    Page<EnrollmentRequest> findByTeacherIdAndType(
            @Param("teacherId") UUID teacherId,
            @Param("requestType") RequestType requestType,
            Pageable pageable);

    boolean existsByStudentIdAndSwimStyleAndStatusIn(UUID studentId, SwimStyle swimStyle, Collection<RequestStatus> statuses);

    boolean existsByTargetEnrollmentIdAndStatusIn(UUID targetEnrollmentId, Collection<RequestStatus> statuses);
}
