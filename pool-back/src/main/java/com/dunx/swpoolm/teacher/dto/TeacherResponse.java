package com.dunx.swpoolm.teacher.dto;

import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TeacherResponse {
    private UUID id;
    private String fullName;
    private String phoneNumber;
    private String specialty;
    private TeacherStatus status;
}