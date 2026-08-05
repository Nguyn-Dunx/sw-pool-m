package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class EnrollmentResponse {
    private UUID id;
    private String studentName;
    private List<String> teacherNames;
    private SwimStyle swimStyle;
    private Boolean isGuaranteed;
    private Integer totalQuota;
    private LocalDate startDate;
    private LocalDate expireDate;
    private EnrollmentStatus status;
}