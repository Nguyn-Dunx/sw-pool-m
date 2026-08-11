package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.AlertResponse;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.AlertType;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final EnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final MessageService messageService;
    private final SettingService settingService;

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getAlerts(UUID userId, boolean isAdmin) {
        LocalDate today = LocalDate.now();
        int expireDays = settingService.getInt("alert.expire-threshold-days");
        int absentDays = settingService.getInt("alert.absent-threshold-days");

        LocalDate expireThreshold = today.plusDays(expireDays);
        LocalDate absentThreshold = today.minusDays(absentDays);

        List<Enrollment> expiringSoon;
        List<Enrollment> absentStudents;

        if (isAdmin) {
            expiringSoon = enrollmentRepository.findExpiringSoonEnrollments(today, expireThreshold);
            absentStudents = enrollmentRepository.findAbsentEnrollments(absentThreshold);
        } else {
            Teacher teacher = teacherRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

            expiringSoon = enrollmentRepository.findExpiringSoonEnrollmentsByTeacher(teacher.getId(), today, expireThreshold);
            absentStudents = enrollmentRepository.findAbsentEnrollmentsByTeacher(teacher.getId(), absentThreshold);
        }

        List<AlertResponse> alerts = new ArrayList<>();

        // 1. Sắp hết hạn
        for (Enrollment e : expiringSoon) {
            long daysLeft = ChronoUnit.DAYS.between(today, e.getExpireDate());
            String msg = messageService.get(MessageKeys.Alert.EXPIRING_SOON, daysLeft, e.getExpireDate());
            alerts.add(buildAlert(e, AlertType.EXPIRING_SOON, msg));
        }

        // 2. Vắng mặt lâu ngày
        for (Enrollment e : absentStudents) {
            LocalDate lastAttendDate = attendanceRecordRepository.findLastAttendDateByEnrollmentId(e.getId());
            LocalDate fromDate = (lastAttendDate != null) ? lastAttendDate : e.getStartDate();
            long actualAbsentDays = ChronoUnit.DAYS.between(fromDate, today);
            String msg = messageService.get(MessageKeys.Alert.ABSENT, actualAbsentDays);
            alerts.add(buildAlert(e, AlertType.ABSENT, msg));
        }

        return alerts;
    }

    /**
     * Build AlertResponse từ Enrollment — tránh duplicate code trong vòng for.
     */
    private AlertResponse buildAlert(Enrollment e, AlertType type, String message) {
        return AlertResponse.builder()
                .enrollmentId(e.getId())
                .studentName(e.getStudent().getFullName())
                .alertType(String.valueOf(type))
                .message(message)
                .build();
    }
}
