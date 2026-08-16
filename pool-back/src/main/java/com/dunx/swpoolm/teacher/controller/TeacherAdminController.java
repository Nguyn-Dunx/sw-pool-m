package com.dunx.swpoolm.teacher.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.teacher.dto.TeacherCreateRequest;
import com.dunx.swpoolm.teacher.dto.TeacherResponse;
import com.dunx.swpoolm.teacher.dto.TeacherUpdateRequest;
import com.dunx.swpoolm.teacher.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/teachers")
@RequiredArgsConstructor
public class TeacherAdminController {

    private final TeacherService teacherService;
    private final com.dunx.swpoolm.teacher.service.TeacherExcelService teacherExcelService;
    private final MessageService messageService;

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportTeachers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.dunx.swpoolm.teacher.enums.TeacherStatus status) throws java.io.IOException {

        byte[] excelBytes = teacherExcelService.exportTeachers(keyword, status);
        String filename = "Danh_Sach_Giao_Vien_" + java.time.LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(
            @Valid @RequestBody TeacherCreateRequest request) { // @Valid để kích hoạt validate DTO

        TeacherResponse response = teacherService.createTeacher(request);

        String message = messageService.get(MessageKeys.Common.CREATED);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<TeacherResponse>>> getTeachers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.dunx.swpoolm.teacher.enums.TeacherStatus status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<TeacherResponse> response = teacherService.getTeachers(keyword, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable UUID id,
            @Valid @RequestBody TeacherUpdateRequest request) {

        TeacherResponse response = teacherService.updateTeacher(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.UPDATED)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable UUID id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.ok(ApiResponse.success(null, messageService.get(MessageKeys.Common.DELETED)));
    }
}