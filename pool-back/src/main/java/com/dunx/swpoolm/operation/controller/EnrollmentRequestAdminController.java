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
    private final com.dunx.swpoolm.operation.service.EnrollmentRequestExcelService enrollmentRequestExcelService;
    private final MessageService messageService;

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) RequestType requestType,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            @RequestParam(required = false) Boolean isGuaranteed,
            @RequestParam(required = false) String searchName) throws java.io.IOException {

        byte[] excelBytes = enrollmentRequestExcelService.exportAdminRequests(
                status, requestType, swimStyle, isGuaranteed, searchName);

        String filename = "Yeu_Cau_Dang_Ky_" + java.time.LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentRequestResponse>>> getRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) RequestType requestType,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            @RequestParam(required = false) Boolean isGuaranteed,
            @RequestParam(required = false) String searchName,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<EnrollmentRequestResponse> response = enrollmentRequestService.getRequestsByAdminFilters(
                status, requestType, swimStyle, isGuaranteed, searchName, page, size);

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
