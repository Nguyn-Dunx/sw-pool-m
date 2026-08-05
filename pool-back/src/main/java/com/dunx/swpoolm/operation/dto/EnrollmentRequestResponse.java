package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
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
    private Instant createdAt;
    private Instant reviewedAt;
}
