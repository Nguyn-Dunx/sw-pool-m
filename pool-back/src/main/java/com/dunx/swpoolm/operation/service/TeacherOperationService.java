package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.operation.dto.AttendanceCreateRequest;
import com.dunx.swpoolm.operation.dto.AttendanceHistoryResponse;
import com.dunx.swpoolm.operation.dto.AttendanceResponse;
import com.dunx.swpoolm.operation.dto.TeacherDashboardResponse;

import java.util.List;
import java.util.UUID;

public interface TeacherOperationService {
    AttendanceResponse checkInStudent(UUID userId, AttendanceCreateRequest request);
    PageResponse<TeacherDashboardResponse> getMyStudents(UUID userId, int page, int size);
    List<AttendanceHistoryResponse> getStudentHistory(UUID userId, UUID enrollmentId);
}
