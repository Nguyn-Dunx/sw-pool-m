package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardSummaryResponse {
    private long totalActiveStudents;
    private long totalActiveTeachers;
    private long newEnrollmentsThisMonth;
    private List<MonthlyChartData> enrollmentChartData;

    @Data
    @Builder
    public static class MonthlyChartData {
        private String month;
        private int value;
    }
}
