package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;

import java.util.UUID;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentCreateRequest request);
    EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request);
}