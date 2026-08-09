package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse;
import com.dunx.swpoolm.operation.service.TeacherOperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher/dashboard")
@RequiredArgsConstructor
public class TeacherDashboardController {

    private final TeacherOperationService teacherOperationService;
    private final MessageService messageService;

    // API Báo cáo tổng quan cho Trang chủ của Giáo viên
    @GetMapping("/summary")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<TeacherDashboardSummaryResponse>> getDashboardSummary(
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        TeacherDashboardSummaryResponse response = teacherOperationService.getDashboardSummary(userDetails.getUser().getId());

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }
}
