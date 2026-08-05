package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.AttendanceCreateRequest;
import com.dunx.swpoolm.operation.dto.AttendanceResponse;

import java.util.UUID;

public interface TeacherOperationService {
    public AttendanceResponse checkInStudent(UUID userId, AttendanceCreateRequest request);

}
