package com.dunx.swpoolm.student.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.student.dto.StudentCreateRequest;
import com.dunx.swpoolm.student.dto.StudentResponse;
import com.dunx.swpoolm.student.dto.StudentUpdateRequest;
import com.dunx.swpoolm.student.dto.TeacherStudentCreateRequest;

import java.util.UUID;

public interface StudentService {
    StudentResponse createStudent(StudentCreateRequest request);
    StudentResponse createStudentByTeacher(TeacherStudentCreateRequest request);
    PageResponse<StudentResponse> getStudents(String keyword, com.dunx.swpoolm.student.enums.SourceType sourceType, int page, int size);
    StudentResponse updateStudent(UUID id, StudentUpdateRequest request);
    void deleteStudent(UUID id);
}