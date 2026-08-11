package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.operation.cronjob.EnrollmentCronjobService;
import com.dunx.swpoolm.operation.dto.AlertResponse;
import com.dunx.swpoolm.operation.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final MessageService messageService;
    private final EnrollmentCronjobService enrollmentCronjobService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<AlertResponse>>> getSystemAlerts(Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        UUID userId = userDetails.getUser().getId();

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));

        List<AlertResponse> alerts = alertService.getAlerts(userId, isAdmin);

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
