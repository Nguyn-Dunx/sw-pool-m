package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TeacherDashboardResponse {
    private UUID enrollmentId;
    private String studentName;
    private SwimStyle swimStyle;
    private Boolean isGuaranteed;

    // For Progress Bar
    private Integer totalQuota;
    private Integer attendedSessions;
    private Integer progressPercentage;

    // Cảnh báo hết hạn
    private LocalDate expireDate;
    private Long daysRemaining; // Nếu < 5 thì Frontend sẽ tô đỏ
    
    // Bổ sung thêm
    private String studentPhone;
    private com.dunx.swpoolm.operation.enums.EnrollmentStatus status;
}