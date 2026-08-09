package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;

import java.util.List;
import java.util.UUID;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentCreateRequest request);
    EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request);
    void completeEnrollment(UUID enrollmentId);
    List<AlertResponse> getSystemAlerts(UUID userId, boolean isAdmin);
    AdminDashboardSummaryResponse getAdminDashboardSummary();

    PageResponse<EnrollmentResponse> getEnrollments(EnrollmentStatus status, SwimStyle swimStyle,
                                                     String studentName, UUID teacherId, int page, int size);
    EnrollmentDetailResponse getEnrollmentDetail(UUID enrollmentId);
}