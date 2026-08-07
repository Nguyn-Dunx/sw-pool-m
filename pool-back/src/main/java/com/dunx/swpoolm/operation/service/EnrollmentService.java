package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.AlertResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentCreateRequest request);
    EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request);
    List<AlertResponse> getSystemAlerts(UUID userId, boolean isAdmin);
}