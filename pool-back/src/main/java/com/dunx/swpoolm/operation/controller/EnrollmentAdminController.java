package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.operation.cronjob.EnrollmentCronjobService;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/enrollments")
@RequiredArgsConstructor
public class EnrollmentAdminController {

    private final EnrollmentService enrollmentService;
    private final MessageService messageService;
    private final EnrollmentCronjobService enrollmentCronjobService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<EnrollmentResponse>>> getEnrollments(
            @RequestParam(required = false) EnrollmentStatus status,
            @RequestParam(required = false) SwimStyle swimStyle,
            @RequestParam(required = false) String studentName,
            @RequestParam(required = false) UUID teacherId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<EnrollmentResponse> response = enrollmentService.getEnrollments(
                status, swimStyle, studentName, teacherId, page, size);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentDetailResponse>> getEnrollmentDetail(@PathVariable UUID id) {
        EnrollmentDetailResponse response = enrollmentService.getEnrollmentDetail(id);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> createEnrollment(
            @Valid @RequestBody EnrollmentCreateRequest request) {

        EnrollmentResponse response = enrollmentService.createEnrollment(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, messageService.get(MessageKeys.Common.CREATED)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> updateEnrollment(
            @PathVariable UUID id,
            @Valid @RequestBody EnrollmentUpdateRequest request) {

        EnrollmentResponse response = enrollmentService.updateEnrollment(id, request);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.UPDATED)));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getSystemAlerts(Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UUID userId = userDetails.getUser().getId();

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));

        List<AlertResponse> alerts = enrollmentService.getSystemAlerts(userId, isAdmin);

        return ResponseEntity.ok(ApiResponse.success(alerts, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PostMapping("/cronjobs/auto-expire")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> triggerAutoExpireCronjob() {

        enrollmentCronjobService.autoExpireEnrollmentsJob();

        return ResponseEntity.ok(ApiResponse.success(
                "Triggered",
                "Cronjob quét khóa học hết hạn đã được chạy thủ công thành công!"
        ));
    }
}