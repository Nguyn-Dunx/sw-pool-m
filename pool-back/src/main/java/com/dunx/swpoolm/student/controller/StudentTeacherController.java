package com.dunx.swpoolm.student.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.student.dto.StudentResponse;
import com.dunx.swpoolm.student.dto.TeacherStudentCreateRequest;
import com.dunx.swpoolm.student.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teacher/students")
@RequiredArgsConstructor
public class StudentTeacherController {

    private final StudentService studentService;
    private final MessageService messageService;

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<StudentResponse>> createStudent(
            @Valid @RequestBody TeacherStudentCreateRequest request) {

        StudentResponse response = studentService.createStudentByTeacher(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, messageService.get(MessageKeys.Common.CREATED)));
    }

    /**
     * Teacher lấy danh sách học viên (để chọn khi tạo enrollment request).
     * Trả về page, teacher có thể search theo tên/SĐT.
     */
    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<PageResponse<StudentResponse>>> getStudents(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "100") int size) {

        PageResponse<StudentResponse> response = studentService.getStudents(keyword, null, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.SUCCESS)));
    }
}
