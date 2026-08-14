package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.operation.dto.AdminDashboardSummaryResponse;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    @DisplayName("getAdminDashboardSummary tổng hợp số liệu học viên, giáo viên và biểu đồ 6 tháng")
    void getAdminDashboardSummary_aggregatesMetrics() {
        when(enrollmentRepository.countByStatus(EnrollmentStatus.ACTIVE)).thenReturn(42L);
        when(teacherRepository.countByStatus(TeacherStatus.ACTIVE)).thenReturn(8L);
        when(enrollmentRepository.countByCreatedAtBetween(any(), any())).thenReturn(15L);

        AdminDashboardSummaryResponse summary = dashboardService.getAdminDashboardSummary();

        assertThat(summary).isNotNull();
        assertThat(summary.getTotalActiveStudents()).isEqualTo(42L);
        assertThat(summary.getTotalActiveTeachers()).isEqualTo(8L);
        assertThat(summary.getNewEnrollmentsThisMonth()).isEqualTo(15L);
        assertThat(summary.getEnrollmentChartData()).hasSize(6);
    }
}
