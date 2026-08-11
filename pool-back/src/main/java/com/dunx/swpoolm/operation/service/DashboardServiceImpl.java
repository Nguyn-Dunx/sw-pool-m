package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.AdminDashboardSummaryResponse;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getAdminDashboardSummary() {
        long totalActiveStudents = enrollmentRepository.countByStatus(EnrollmentStatus.ACTIVE);
        long totalActiveTeachers = teacherRepository.countByStatus(TeacherStatus.ACTIVE);

        LocalDate today = LocalDate.now();
        LocalDate startOfMonthDate = today.withDayOfMonth(1);
        LocalDate endOfMonthDate = today.withDayOfMonth(today.lengthOfMonth());

        Instant startOfMonth = startOfMonthDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfMonth = endOfMonthDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().minusMillis(1);

        long newEnrollmentsThisMonth = enrollmentRepository.countByCreatedAtBetween(startOfMonth, endOfMonth);

        List<AdminDashboardSummaryResponse.MonthlyChartData> chartData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = today.minusMonths(i);
            LocalDate start = monthDate.withDayOfMonth(1);
            LocalDate end = monthDate.withDayOfMonth(monthDate.lengthOfMonth());

            Instant startInstant = start.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant endInstant = end.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().minusMillis(1);

            long count = enrollmentRepository.countByCreatedAtBetween(startInstant, endInstant);

            chartData.add(AdminDashboardSummaryResponse.MonthlyChartData.builder()
                    .month(monthDate.format(formatter))
                    .value((int) count)
                    .build());
        }

        return AdminDashboardSummaryResponse.builder()
                .totalActiveStudents(totalActiveStudents)
                .totalActiveTeachers(totalActiveTeachers)
                .newEnrollmentsThisMonth(newEnrollmentsThisMonth)
                .enrollmentChartData(chartData)
                .build();
    }
}
