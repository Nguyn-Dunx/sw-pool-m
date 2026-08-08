package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class EnrollmentRequestResponse {
    private UUID id;
    private String studentName;
    private String teacherName;
    private SwimStyle swimStyle;
    private Boolean isGuaranteed;
    private String note;
    private String adminNote;
    private RequestStatus status;
    private RequestType requestType;
    private UUID targetEnrollmentId;
    private Integer totalQuota;
    private LocalDate startDate;
    private LocalDate expireDate;
    private Instant createdAt;
    private Instant reviewedAt;
}
