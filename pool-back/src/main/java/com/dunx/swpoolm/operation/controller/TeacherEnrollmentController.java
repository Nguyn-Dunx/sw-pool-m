package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.operation.dto.AttendanceHistoryResponse;
import com.dunx.swpoolm.operation.dto.TeacherDashboardResponse;
import com.dunx.swpoolm.operation.service.TeacherOperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher/enrollments")
@RequiredArgsConstructor
public class TeacherEnrollmentController {

    private final TeacherOperationService teacherOperationService;
    private final com.dunx.swpoolm.operation.service.EnrollmentExcelService enrollmentExcelService;
    private final MessageService messageService;

    @GetMapping("/export")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<byte[]> exportMyStudents(
            @RequestParam(required = false) String searchName,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.EnrollmentStatus status,
            @RequestParam(required = false) Boolean isGuaranteed,
            Authentication authentication) throws java.io.IOException {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        byte[] excelBytes = enrollmentExcelService.exportTeacherStudents(
                userDetails.getUser().getId(), searchName, swimStyle, status, isGuaranteed);

        String filename = "Hoc_Vien_Phu_Trach_" + java.time.LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/{enrollmentId}/history/export")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportStudentHistory(
            @PathVariable UUID enrollmentId) throws java.io.IOException {

        byte[] excelBytes = enrollmentExcelService.exportStudentHistory(enrollmentId);
        String filename = "Lich_Su_Diem_Danh_" + java.time.LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // 1. API Lấy danh sách Khóa học (Học viên) của Giáo viên (Có lọc đa chiều)
    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<PageResponse<TeacherDashboardResponse>>> getMyStudents(
            @RequestParam(required = false) String searchName,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            @RequestParam(required = false) com.dunx.swpoolm.operation.enums.EnrollmentStatus status,
            @RequestParam(required = false) Boolean isGuaranteed,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        PageResponse<TeacherDashboardResponse> response = teacherOperationService.getMyStudents(
                userDetails.getUser().getId(), searchName, swimStyle, status, isGuaranteed, page, size);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    // 2. API Xem chi tiết Lịch sử điểm danh của 1 Khóa học
    @GetMapping("/{enrollmentId}/history")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<List<AttendanceHistoryResponse>>> getStudentHistory(
            @PathVariable UUID enrollmentId,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        List<AttendanceHistoryResponse> response = teacherOperationService.getStudentHistory(userDetails.getUser().getId(), enrollmentId);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    // 3. API Xem chi tiết Khóa học dành cho Teacher
    @GetMapping("/{enrollmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse>> getEnrollmentDetail(
            @PathVariable UUID enrollmentId,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse response = teacherOperationService.getEnrollmentDetail(userDetails.getUser().getId(), enrollmentId);

        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    // 4. API Đóng khóa học thủ công (Teacher)
    @PutMapping("/{enrollmentId}/complete")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<Void>> completeEnrollment(
            @PathVariable UUID enrollmentId,
            Authentication authentication) {

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        teacherOperationService.completeEnrollment(userDetails.getUser().getId(), enrollmentId);

        return ResponseEntity.ok(ApiResponse.success(null, messageService.get(MessageKeys.Common.SUCCESS)));
    }
}