package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.PaymentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;

import java.util.UUID;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentCreateRequest request);
    EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request);
    void completeEnrollment(UUID enrollmentId);
    void updatePaymentStatus(UUID enrollmentId, PaymentStatus paymentStatus);

    PageResponse<EnrollmentResponse> getEnrollments(EnrollmentStatus status, SwimStyle swimStyle, Boolean isGuaranteed,
                                                    PaymentStatus paymentStatus, String studentName, UUID teacherId,
                                                    int page, int size);
    EnrollmentDetailResponse getEnrollmentDetail(UUID enrollmentId);
}