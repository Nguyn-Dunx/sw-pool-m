package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeacherDashboardSummaryResponse {
    private long totalActiveStudents;
    private long totalSessionsTaughtThisMonth;
    private long expiringSoonCount;
    private long absentCount;
}
