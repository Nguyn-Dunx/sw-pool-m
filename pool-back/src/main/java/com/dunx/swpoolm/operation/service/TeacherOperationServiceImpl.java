package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.dto.AttendanceCreateRequest;
import com.dunx.swpoolm.operation.dto.AttendanceResponse;
import com.dunx.swpoolm.operation.entity.AttendanceRecord;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.entity.Shift;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.operation.repository.ShiftRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherOperationServiceImpl implements TeacherOperationService {

    private final AttendanceRecordRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ShiftRepository shiftRepository;
    private final TeacherRepository teacherRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AttendanceResponse checkInStudent(UUID userId, AttendanceCreateRequest request) {

        Teacher currentTeacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        // Co-teaching Rule
        boolean isAssigned = enrollment.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(currentTeacher.getId()));
        if (!isAssigned) {
            throw new AppException(MessageKeys.Attendance.UNAUTHORIZED);
        }

        // Validate
        LocalDate attendDate = request.getAttendDate();
        if (attendDate.isBefore(enrollment.getStartDate()) || attendDate.isAfter(enrollment.getExpireDate())) {
            throw new AppException(MessageKeys.Attendance.INVALID_DATE);
        }

        boolean isDuplicated = attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(
                enrollment.getId(), shift.getId(), attendDate);
        if (isDuplicated) {
            throw new AppException(MessageKeys.Attendance.DUPLICATE);
        }

        long currentSessions = attendanceRepository.countByEnrollmentId(enrollment.getId());

        if (currentSessions >= enrollment.getTotalQuota()) {
            if (!enrollment.getIsGuaranteed()) {
                // Không cam kết + Đã hết buổi => Chặn không cho điểm danh
                throw new AppException(MessageKeys.Attendance.QUOTA_EXCEEDED);
            }
            // Nếu có cam kết (isGuaranteed = true), vẫn cho qua (sẽ highlight ở frontend)
            log.info("Học viên {} đang học bù buổi thứ {}", enrollment.getStudent().getFullName(), currentSessions + 1);
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .enrollment(enrollment)
                .shift(shift)
                .teacher(currentTeacher)
                .attendDate(attendDate)
                .note(request.getNote())
                .build();
        AttendanceRecord savedRecord = attendanceRepository.save(record);

        long newSessionCount = currentSessions + 1;
        if (!enrollment.getIsGuaranteed() && newSessionCount == enrollment.getTotalQuota()) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
            enrollmentRepository.save(enrollment);
            log.info("Khóa học của {} đã tự động chuyển sang COMPLETED", enrollment.getStudent().getFullName());
        }

        String shiftTimeDisplay = shift.getStartTime().toString() + " - " + shift.getEndTime().toString();

        return AttendanceResponse.builder()
                .id(savedRecord.getId())
                .studentName(enrollment.getStudent().getFullName())
                .shiftTime(shiftTimeDisplay)
                .attendDate(savedRecord.getAttendDate())
                .currentSessionCount((int) newSessionCount)
                .note(savedRecord.getNote())
                .build();
    }
}