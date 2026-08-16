package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestCreateDTO;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestReviewDTO;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;

import java.util.UUID;

public interface EnrollmentRequestService {

    EnrollmentRequestResponse createRequest(UUID userId, EnrollmentRequestCreateDTO request);

    PageResponse<EnrollmentRequestResponse> getRequestsByTeacher(UUID userId, RequestStatus status, RequestType requestType, int page, int size);

    PageResponse<EnrollmentRequestResponse> getRequestsByAdminFilters(RequestStatus status, RequestType requestType, com.dunx.swpoolm.operation.enums.SwimStyle swimStyle, Boolean isGuaranteed, String studentName, int page, int size);

    PageResponse<EnrollmentRequestResponse> getRequestsByStatus(RequestStatus status, RequestType requestType, int page, int size);

    EnrollmentRequestResponse reviewRequest(UUID requestId, EnrollmentRequestReviewDTO reviewDTO);
}
