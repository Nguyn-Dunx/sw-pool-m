package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;
import com.dunx.swpoolm.operation.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/enrollments")
@RequiredArgsConstructor
public class EnrollmentAdminController {

    private final EnrollmentService enrollmentService;
    private final MessageService messageService;

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
}