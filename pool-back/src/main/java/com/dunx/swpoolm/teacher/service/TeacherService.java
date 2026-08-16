package com.dunx.swpoolm.teacher.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.teacher.dto.TeacherCreateRequest;
import com.dunx.swpoolm.teacher.dto.TeacherResponse;
import com.dunx.swpoolm.teacher.dto.TeacherUpdateRequest;

import java.util.UUID;

public interface TeacherService {
    TeacherResponse createTeacher(TeacherCreateRequest request);
    PageResponse<TeacherResponse> getTeachers(String keyword, com.dunx.swpoolm.teacher.enums.TeacherStatus status, int page, int size);
    TeacherResponse updateTeacher(UUID id, TeacherUpdateRequest request);
    void deleteTeacher(UUID id);
}