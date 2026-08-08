package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestReviewDTO;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.service.EnrollmentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/enrollment-requests")
@RequiredArgsConstructor
public class EnrollmentRequestAdminController {

    private final EnrollmentRequestService enrollmentRequestService;
    private final MessageService messageService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentRequestResponse>>> getRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) RequestType requestType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        RequestStatus filterStatus = (status != null) ? status : RequestStatus.PENDING;
        PageResponse<EnrollmentRequestResponse> response = enrollmentRequestService.getRequestsByStatus(
                filterStatus, requestType, page, size);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentRequestResponse>> reviewRequest(
            @PathVariable UUID id,
            @Valid @RequestBody EnrollmentRequestReviewDTO reviewDTO) {

        EnrollmentRequestResponse response = enrollmentRequestService.reviewRequest(id, reviewDTO);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }
}
