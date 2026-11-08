package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.operation.dto.AttendanceCreateRequest;
import com.dunx.swpoolm.operation.dto.AttendanceHistoryResponse;
import com.dunx.swpoolm.operation.dto.AttendanceResponse;
import com.dunx.swpoolm.operation.dto.TeacherDashboardResponse;
import com.dunx.swpoolm.operation.enums.PaymentStatus;

import java.util.List;
import java.util.UUID;

public interface TeacherOperationService {
    AttendanceResponse checkInStudent(UUID userId, AttendanceCreateRequest request);
    PageResponse<TeacherDashboardResponse> getMyStudents(
            UUID userId, String searchName, com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            com.dunx.swpoolm.operation.enums.EnrollmentStatus status, Boolean isGuaranteed,
            PaymentStatus paymentStatus, int page, int size);
    List<AttendanceHistoryResponse> getStudentHistory(UUID userId, UUID enrollmentId);
    void completeEnrollment(UUID userId, UUID enrollmentId);
    void updatePaymentStatus(UUID userId, UUID enrollmentId, PaymentStatus paymentStatus);
    com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse getEnrollmentDetail(UUID userId, UUID enrollmentId);
    com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse getDashboardSummary(UUID userId);
}
