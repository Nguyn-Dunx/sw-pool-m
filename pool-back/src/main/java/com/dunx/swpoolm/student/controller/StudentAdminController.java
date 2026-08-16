package com.dunx.swpoolm.student.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.student.dto.StudentCreateRequest;
import com.dunx.swpoolm.student.dto.StudentResponse;
import com.dunx.swpoolm.student.dto.StudentUpdateRequest;
import com.dunx.swpoolm.student.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/students")
@RequiredArgsConstructor
public class StudentAdminController {

    private final StudentService studentService;
    private final MessageService messageService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> createStudent(
            @Valid @RequestBody StudentCreateRequest request) {
        StudentResponse response = studentService.createStudent(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, messageService.get(MessageKeys.Common.CREATED)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<StudentResponse>>> getStudents(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) com.dunx.swpoolm.student.enums.SourceType sourceType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<StudentResponse> response = studentService.getStudents(keyword, sourceType, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> updateStudent(
            @PathVariable UUID id,
            @Valid @RequestBody StudentUpdateRequest request) {
        StudentResponse response = studentService.updateStudent(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.UPDATED)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable UUID id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success(null, messageService.get(MessageKeys.Common.DELETED)));
    }
}