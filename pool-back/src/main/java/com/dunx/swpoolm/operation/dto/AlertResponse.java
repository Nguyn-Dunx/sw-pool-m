package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AlertResponse {
    private UUID enrollmentId;
    private String studentName;
    private String alertType; // "EXPIRING_SOON" or "ABSENT"
    private String message;
}