package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TeacherDashboardSummaryResponse {
    private long totalActiveStudents;
    private long totalSessionsTaughtThisMonth;
    private long expiringSoonCount;
    private long absentCount;
    private List<MonthlyChartData> attendanceChartData;
    private List<WeeklyChartData> weeklyAttendanceChartData;

    @Data
    @Builder
    public static class MonthlyChartData {
        private String month;
        private int value;
    }

    @Data
    @Builder
    public static class WeeklyChartData {
        private String week;
        private int value;
    }
}
