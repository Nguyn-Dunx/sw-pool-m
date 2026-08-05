package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface EnrollmentRequestRepository extends JpaRepository<EnrollmentRequest, UUID> {

    Page<EnrollmentRequest> findByStatus(RequestStatus status, Pageable pageable);

    Page<EnrollmentRequest> findByTeacherId(UUID teacherId, Pageable pageable);

    boolean existsByStudentIdAndSwimStyleAndStatusIn(UUID studentId, SwimStyle swimStyle, Collection<RequestStatus> statuses);
}
