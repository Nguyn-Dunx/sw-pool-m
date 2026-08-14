package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.AlertResponse;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.AlertType;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private MessageService messageService;

    @Mock
    private SettingService settingService;

    @InjectMocks
    private AlertServiceImpl alertService;

    @Nested
    @DisplayName("getAlerts()")
    class GetAlertsTests {

        @Test
        @DisplayName("Admin lấy toàn bộ cảnh báo (sắp hết hạn và vắng mặt)")
        void getAlerts_forAdmin_returnsAllAlerts() {
            Student student1 = Student.builder().fullName("Student 1").build();
            student1.setId(UUID.randomUUID());
            Student student2 = Student.builder().fullName("Student 2").build();
            student2.setId(UUID.randomUUID());

            Enrollment expiring = Enrollment.builder()
                    .student(student1)
                    .expireDate(LocalDate.now().plusDays(3))
                    .build();
            expiring.setId(UUID.randomUUID());

            Enrollment absent = Enrollment.builder()
                    .student(student2)
                    .startDate(LocalDate.now().minusDays(10))
                    .build();
            absent.setId(UUID.randomUUID());

            when(settingService.getInt("alert.expire-threshold-days")).thenReturn(5);
            when(settingService.getInt("alert.absent-threshold-days")).thenReturn(7);
            when(enrollmentRepository.findExpiringSoonEnrollments(any(), any())).thenReturn(List.of(expiring));
            when(enrollmentRepository.findAbsentEnrollments(any())).thenReturn(List.of(absent));
            when(attendanceRecordRepository.findLastAttendDateByEnrollmentId(absent.getId())).thenReturn(LocalDate.now().minusDays(8));
            when(messageService.get(eq(MessageKeys.Alert.EXPIRING_SOON), any(), any())).thenReturn("Sap het han");
            when(messageService.get(eq(MessageKeys.Alert.ABSENT), any())).thenReturn("Vang mat lau");

            List<AlertResponse> alerts = alertService.getAlerts(UUID.randomUUID(), true);

            assertThat(alerts).hasSize(2);
            assertThat(alerts.get(0).getAlertType()).isEqualTo(String.valueOf(AlertType.EXPIRING_SOON));
            assertThat(alerts.get(0).getStudentName()).isEqualTo("Student 1");
            assertThat(alerts.get(1).getAlertType()).isEqualTo(String.valueOf(AlertType.ABSENT));
            assertThat(alerts.get(1).getStudentName()).isEqualTo("Student 2");
        }

        @Test
        @DisplayName("Teacher chỉ lấy cảnh báo thuộc học viên mình phụ trách")
        void getAlerts_forTeacher_returnsFilteredAlerts() {
            UUID userId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();
            Teacher teacher = Teacher.builder().fullName("Teacher A").build();
            teacher.setId(teacherId);
            Student student = Student.builder().fullName("My Student").build();
            student.setId(UUID.randomUUID());

            Enrollment expiring = Enrollment.builder()
                    .student(student)
                    .expireDate(LocalDate.now().plusDays(2))
                    .build();
            expiring.setId(UUID.randomUUID());

            when(settingService.getInt("alert.expire-threshold-days")).thenReturn(5);
            when(settingService.getInt("alert.absent-threshold-days")).thenReturn(7);
            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findExpiringSoonEnrollmentsByTeacher(eq(teacherId), any(), any())).thenReturn(List.of(expiring));
            when(enrollmentRepository.findAbsentEnrollmentsByTeacher(eq(teacherId), any())).thenReturn(List.of());
            when(messageService.get(eq(MessageKeys.Alert.EXPIRING_SOON), any(), any())).thenReturn("Sap het han");

            List<AlertResponse> alerts = alertService.getAlerts(userId, false);

            assertThat(alerts).hasSize(1);
            assertThat(alerts.get(0).getStudentName()).isEqualTo("My Student");
            verify(enrollmentRepository, never()).findExpiringSoonEnrollments(any(), any());
        }
    }
}
