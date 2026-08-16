package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestCreateDTO;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestResponse;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.service.EnrollmentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teacher/enrollment-requests")
@RequiredArgsConstructor
public class EnrollmentRequestController {

    private final EnrollmentRequestService enrollmentRequestService;
    private final com.dunx.swpoolm.operation.service.EnrollmentRequestExcelService enrollmentRequestExcelService;
    private final MessageService messageService;

    @GetMapping("/export")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> exportMyRequests(
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.RequestStatus status,
            @RequestParam(required = false) RequestType requestType,
            Authentication authentication) throws java.io.IOException {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        byte[] excelBytes = enrollmentRequestExcelService.exportTeacherRequests(
                userDetails.getUser().getId(), status, requestType);

        String filename = "Yeu_Cau_Cua_Toi_" + java.time.LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<EnrollmentRequestResponse>> createRequest(
            @Valid @RequestBody EnrollmentRequestCreateDTO request,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        EnrollmentRequestResponse response = enrollmentRequestService.createRequest(
                userDetails.getUser().getId(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, messageService.get(MessageKeys.Common.CREATED)));
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentRequestResponse>>> getMyRequests(
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.RequestStatus status,
            @RequestParam(required = false) RequestType requestType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        PageResponse<EnrollmentRequestResponse> response = enrollmentRequestService.getRequestsByTeacher(
                userDetails.getUser().getId(), status, requestType, page, size);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }
}
