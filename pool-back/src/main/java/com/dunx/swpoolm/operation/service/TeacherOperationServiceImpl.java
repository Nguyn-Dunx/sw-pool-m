package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageRequestValidator;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.AttendanceCreateRequest;
import com.dunx.swpoolm.operation.dto.AttendanceHistoryResponse;
import com.dunx.swpoolm.operation.dto.AttendanceResponse;
import com.dunx.swpoolm.operation.dto.TeacherDashboardResponse;
import com.dunx.swpoolm.operation.entity.AttendanceRecord;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.entity.Shift;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentAttendanceCount;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.operation.repository.ShiftRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherOperationServiceImpl implements TeacherOperationService {

    private final AttendanceRecordRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ShiftRepository shiftRepository;
    private final TeacherRepository teacherRepository;
    private final SettingService settingService;

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

    @Override
    @Transactional(readOnly = true)
    public PageResponse<TeacherDashboardResponse> getMyStudents(
            UUID userId, String searchName, com.dunx.swpoolm.operation.enums.SwimStyle swimStyle,
            EnrollmentStatus status, Boolean isGuaranteed,
            int page, int size) {

        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Pageable pageable = PageRequestValidator.validate(page, size);

        Page<Enrollment> enrollmentPage = enrollmentRepository.findEnrollmentsByTeacherWithFilters(
                teacher.getId(), status, swimStyle, isGuaranteed, searchName, pageable);

        if (enrollmentPage.isEmpty()) {
            return PageResponse.<TeacherDashboardResponse>builder()
                    .items(List.of())
                    .pageNumber(page)
                    .pageSize(size)
                    .totalElements(0)
                    .totalPages(0)
                    .isLast(true)
                    .build();
        }

        List<UUID> enrollmentIds = enrollmentPage.getContent().stream()
                .map(Enrollment::getId)
                .toList();

        List<EnrollmentAttendanceCount> counts = attendanceRepository.countAttendancesForEnrollments(enrollmentIds);

        Map<UUID, Long> attendanceCountMap = counts.stream()
                .collect(Collectors.toMap(
                        EnrollmentAttendanceCount::getEnrollmentId,
                        EnrollmentAttendanceCount::getSessionCount));

        LocalDate today = LocalDate.now();

        // 4. Lắp ráp dữ liệu trả về cho Frontend
        List<TeacherDashboardResponse> responses = enrollmentPage.getContent().stream().map(enrollment -> {
            int attended = attendanceCountMap.getOrDefault(enrollment.getId(), 0L).intValue();
            int total = enrollment.getTotalQuota();
            int percent = (int) Math.round((double) attended / total * 100);
            long daysRemaining = ChronoUnit.DAYS.between(today, enrollment.getExpireDate());

            return TeacherDashboardResponse.builder()
                    .enrollmentId(enrollment.getId())
                    .studentName(enrollment.getStudent().getFullName())
                    .swimStyle(enrollment.getSwimStyle())
                    .isGuaranteed(enrollment.getIsGuaranteed())
                    .totalQuota(total)
                    .attendedSessions(attended)
                    .progressPercentage(Math.min(percent, 100)) // Chặn quá 100% nếu là học bù
                    .expireDate(enrollment.getExpireDate())
                    .daysRemaining(daysRemaining)
                    .studentPhone(enrollment.getStudent().getPhoneNumber())
                    .status(enrollment.getStatus())
                    .build();
        }).toList();

        return PageResponse.<TeacherDashboardResponse>builder()
                .items(responses)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(enrollmentPage.getTotalElements())
                .totalPages(enrollmentPage.getTotalPages())
                .isLast(enrollmentPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceHistoryResponse> getStudentHistory(UUID userId, UUID enrollmentId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        //check teacher
        boolean isAssigned = enrollment.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacher.getId()));
        if (!isAssigned) {
            throw new AppException(MessageKeys.Attendance.UNAUTHORIZED);
        }

        return attendanceRepository.findByEnrollmentIdOrderByAttendDateDesc(enrollmentId)
                .stream().map(record -> {
                    String shiftTime = record.getShift().getStartTime() + " - " + record.getShift().getEndTime();
                    return AttendanceHistoryResponse.builder()
                            .attendanceId(record.getId())
                            .attendDate(record.getAttendDate())
                            .shiftTime(shiftTime)
                            .checkedInBy(record.getTeacher().getFullName())
                            .note(record.getNote())
                            .build();
                }).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeEnrollment(UUID userId, UUID enrollmentId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        // Kiểm tra quyền: Teacher phải được gán vào lớp này mới được thao tác
        boolean isAssigned = enrollment.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacher.getId()));
        if (!isAssigned) {
            throw new AppException(MessageKeys.Attendance.UNAUTHORIZED);
        }

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new AppException(MessageKeys.Common.BAD_REQUEST);
        }

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollmentRepository.save(enrollment);
        log.info("Teacher {} đã đóng (COMPLETED) khóa học của học viên {}", teacher.getFullName(), enrollment.getStudent().getFullName());
    }

    @Override
    @Transactional(readOnly = true)
    public com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse getEnrollmentDetail(UUID userId, UUID enrollmentId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        boolean isAssigned = enrollment.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(teacher.getId()));
        if (!isAssigned) {
            throw new AppException(MessageKeys.Attendance.UNAUTHORIZED);
        }

        List<String> teacherNames = enrollment.getTeachers().stream()
                .map(Teacher::getFullName).toList();

        List<UUID> teacherIds = enrollment.getTeachers().stream()
                .map(Teacher::getId).toList();

        int attendedSessions = (int) attendanceRepository.countByEnrollmentId(enrollmentId);

        List<AttendanceHistoryResponse> history = attendanceRepository
                .findByEnrollmentIdOrderByAttendDateDesc(enrollmentId)
                .stream().map(record -> {
                    String shiftTime = record.getShift().getStartTime() + " - " + record.getShift().getEndTime();
                    return AttendanceHistoryResponse.builder()
                            .attendanceId(record.getId())
                            .attendDate(record.getAttendDate())
                            .shiftTime(shiftTime)
                            .checkedInBy(record.getTeacher().getFullName())
                            .note(record.getNote())
                            .build();
                }).toList();

        return com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse.builder()
                .id(enrollment.getId())
                .studentName(enrollment.getStudent().getFullName())
                .teacherNames(teacherNames)
                .teacherIds(teacherIds)
                .swimStyle(enrollment.getSwimStyle())
                .isGuaranteed(enrollment.getIsGuaranteed())
                .totalQuota(enrollment.getTotalQuota())
                .attendedSessions(attendedSessions)
                .startDate(enrollment.getStartDate())
                .expireDate(enrollment.getExpireDate())
                .status(enrollment.getStatus())
                .attendanceHistory(history)
                .studentPhone(enrollment.getStudent().getPhoneNumber())
                .studentDob(enrollment.getStudent().getDob())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse getDashboardSummary(UUID userId) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));
        
        UUID teacherId = teacher.getId();
        LocalDate today = LocalDate.now();

        long totalActive = enrollmentRepository.countByTeachers_IdAndStatus(teacherId, EnrollmentStatus.ACTIVE);
        
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        long sessionsThisMonth = attendanceRepository.countByTeacherIdAndAttendDateBetween(teacherId, startOfMonth, endOfMonth);

        // Đọc ngưỡng cảnh báo từ System Settings (đồng bộ với AlertController)
        int expireThresholdDays = settingService.getInt("alert.expire-threshold-days");
        int absentThresholdDays = settingService.getInt("alert.absent-threshold-days");

        LocalDate thresholdDate = today.plusDays(expireThresholdDays);
        long expiringSoon = enrollmentRepository.findExpiringSoonEnrollmentsByTeacher(teacherId, today, thresholdDate).size();

        LocalDate absentThreshold = today.minusDays(absentThresholdDays);
        long absentStudents = enrollmentRepository.findAbsentEnrollmentsByTeacher(teacherId, absentThreshold).size();

        java.util.List<com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse.MonthlyChartData> chartData = new java.util.ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MM/yyyy");

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = today.minusMonths(i);
            LocalDate start = monthDate.withDayOfMonth(1);
            LocalDate end = monthDate.withDayOfMonth(monthDate.lengthOfMonth());

            long count = attendanceRepository.countByTeacherIdAndAttendDateBetween(teacherId, start, end);

            chartData.add(com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse.MonthlyChartData.builder()
                    .month(monthDate.format(formatter))
                    .value((int) count)
                    .build());
        }

        java.util.List<com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse.WeeklyChartData> weeklyChartData = new java.util.ArrayList<>();
        java.time.temporal.WeekFields weekFields = java.time.temporal.WeekFields.of(java.util.Locale.getDefault());
        for (int i = 7; i >= 0; i--) {
            LocalDate weekDate = today.minusWeeks(i);
            LocalDate weekStart = weekDate.with(java.time.DayOfWeek.MONDAY);
            LocalDate weekEnd = weekStart.plusDays(6);

            long count = attendanceRepository.countByTeacherIdAndAttendDateBetween(teacherId, weekStart, weekEnd);

            int weekNumber = weekStart.get(weekFields.weekOfWeekBasedYear());
            weeklyChartData.add(com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse.WeeklyChartData.builder()
                    .week("W" + weekNumber + "/" + weekStart.getYear())
                    .value((int) count)
                    .build());
        }

        return com.dunx.swpoolm.operation.dto.TeacherDashboardSummaryResponse.builder()
                .totalActiveStudents(totalActive)
                .totalSessionsTaughtThisMonth(sessionsThisMonth)
                .expiringSoonCount(expiringSoon)
                .absentCount(absentStudents)
                .attendanceChartData(chartData)
                .weeklyAttendanceChartData(weeklyChartData)
                .build();
    }
}