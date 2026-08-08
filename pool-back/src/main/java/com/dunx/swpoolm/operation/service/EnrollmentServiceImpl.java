package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.AlertType;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.repository.StudentRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final MessageService messageService;
    private final SettingService settingService;

    // ===================== CREATE =====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentResponse createEnrollment(EnrollmentCreateRequest request) {

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

        // Kiểm tra trùng khóa ACTIVE cùng kiểu bơi
        boolean isDuplicate = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                student.getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
        if (isDuplicate) {
            throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
        }

        // Validate & resolve teachers (dùng helper, tránh duplicate code)
        List<Teacher> teachers = resolveAndValidateTeachers(request.getTeacherIds());

        // Lấy giá trị từ request, fallback về Settings nếu null
        int quota = (request.getTotalQuota() != null)
                ? request.getTotalQuota()
                : settingService.getInt("enrollment.default-quota");

        LocalDate startDate = (request.getStartDate() != null)
                ? request.getStartDate()
                : LocalDate.now();

        LocalDate expireDate = (request.getExpireDate() != null)
                ? request.getExpireDate()
                : startDate.plusDays(settingService.getInt("enrollment.duration-days"));

        // Validate: expireDate phải >= startDate
        if (expireDate.isBefore(startDate)) {
            throw new AppException(MessageKeys.Enrollment.INVALID_DATES);
        }

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .swimStyle(request.getSwimStyle())
                .isGuaranteed(request.getIsGuaranteed())
                .startDate(startDate)
                .expireDate(expireDate)
                .totalQuota(quota)
                .status(EnrollmentStatus.ACTIVE)
                .teachers(new HashSet<>(teachers))
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        log.info("Khởi tạo khóa học {} cho {} thành công. Hạn: {}",
                request.getSwimStyle(), student.getFullName(), expireDate);

        return mapToResponse(saved, student.getFullName(),
                teachers.stream().map(Teacher::getFullName).toList());
    }

    // ===================== UPDATE =====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request) {

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        // Không cho sửa enrollment đã COMPLETED hoặc EXPIRED
        if (enrollment.getStatus() == EnrollmentStatus.COMPLETED
                || enrollment.getStatus() == EnrollmentStatus.EXPIRED) {
            throw new AppException(MessageKeys.Enrollment.CANNOT_UPDATE_FINISHED);
        }

        // Cập nhật danh sách giáo viên
        if (request.getTeacherIds() != null && !request.getTeacherIds().isEmpty()) {
            List<Teacher> teachers = resolveAndValidateTeachers(request.getTeacherIds());
            enrollment.setTeachers(new HashSet<>(teachers));
        }

        // Cập nhật cam kết
        if (request.getIsGuaranteed() != null) {
            enrollment.setIsGuaranteed(request.getIsGuaranteed());
        }

        // Cập nhật kiểu bơi (kiểm tra trùng nếu thay đổi)
        if (request.getSwimStyle() != null && request.getSwimStyle() != enrollment.getSwimStyle()) {
            boolean isDuplicate = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                    enrollment.getStudent().getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
            if (isDuplicate) {
                throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
            }
            enrollment.setSwimStyle(request.getSwimStyle());
        }

        // Cập nhật ngày hết hạn (gia hạn)
        if (request.getExpireDate() != null) {
            if (request.getExpireDate().isBefore(enrollment.getStartDate())) {
                throw new AppException(MessageKeys.Enrollment.INVALID_DATES);
            }
            enrollment.setExpireDate(request.getExpireDate());
        }

        // Cập nhật số buổi
        if (request.getTotalQuota() != null) {
            enrollment.setTotalQuota(request.getTotalQuota());
        }

        Enrollment saved = enrollmentRepository.save(enrollment);
        List<String> teacherNames = saved.getTeachers().stream()
                .map(Teacher::getFullName).toList();

        log.info("Admin đã cập nhật Enrollment {} cho học viên {}",
                enrollmentId, enrollment.getStudent().getFullName());

        return mapToResponse(saved, enrollment.getStudent().getFullName(), teacherNames);
    }

    // ===================== ALERTS =====================

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getSystemAlerts(UUID userId, boolean isAdmin) {
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

    // ===================== LIST & DETAIL =====================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentResponse> getEnrollments(EnrollmentStatus status, SwimStyle swimStyle,
                                                            String studentName, UUID teacherId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Enrollment> enrollmentPage;

        if (teacherId != null) {
            // Filter theo teacher
            enrollmentPage = enrollmentRepository.findAllByTeacherWithFilters(teacherId, status, pageable);
        } else {
            // Filter tổng hợp
            enrollmentPage = enrollmentRepository.findAllWithFilters(status, swimStyle, studentName, pageable);
        }

        List<EnrollmentResponse> responses = enrollmentPage.getContent().stream()
                .map(e -> mapToResponse(e, e.getStudent().getFullName(),
                        e.getTeachers().stream().map(Teacher::getFullName).toList()))
                .toList();

        return PageResponse.<EnrollmentResponse>builder()
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
    public EnrollmentDetailResponse getEnrollmentDetail(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        List<String> teacherNames = enrollment.getTeachers().stream()
                .map(Teacher::getFullName).toList();

        int attendedSessions = (int) attendanceRecordRepository.countByEnrollmentId(enrollmentId);

        List<AttendanceHistoryResponse> history = attendanceRecordRepository
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

        return EnrollmentDetailResponse.builder()
                .id(enrollment.getId())
                .studentName(enrollment.getStudent().getFullName())
                .teacherNames(teacherNames)
                .swimStyle(enrollment.getSwimStyle())
                .isGuaranteed(enrollment.getIsGuaranteed())
                .totalQuota(enrollment.getTotalQuota())
                .attendedSessions(attendedSessions)
                .startDate(enrollment.getStartDate())
                .expireDate(enrollment.getExpireDate())
                .status(enrollment.getStatus())
                .attendanceHistory(history)
                .build();
    }

    // ===================== PRIVATE HELPERS =====================

    /**
     * Validate danh sách teacherIds: tồn tại + đang ACTIVE.
     * Trích xuất để tránh duplicate code giữa create và update.
     */
    private List<Teacher> resolveAndValidateTeachers(Set<UUID> teacherIds) {
        if (teacherIds == null || teacherIds.isEmpty()) {
            throw new AppException(MessageKeys.Enrollment.EMPTY_TEACHERS);
        }

        List<Teacher> teachers = teacherRepository.findAllById(teacherIds);

        if (teachers.size() != teacherIds.size()) {
            throw new AppException(MessageKeys.Enrollment.TEACHER_NOT_FOUND);
        }

        boolean hasInactive = teachers.stream()
                .anyMatch(t -> t.getStatus() != TeacherStatus.ACTIVE);
        if (hasInactive) {
            throw new AppException(MessageKeys.Enrollment.TEACHER_INACTIVE);
        }

        return teachers;
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

    private EnrollmentResponse mapToResponse(Enrollment enrollment, String studentName, List<String> teacherNames) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .studentName(studentName)
                .teacherNames(teacherNames)
                .swimStyle(enrollment.getSwimStyle())
                .isGuaranteed(enrollment.getIsGuaranteed())
                .totalQuota(enrollment.getTotalQuota())
                .startDate(enrollment.getStartDate())
                .expireDate(enrollment.getExpireDate())
                .status(enrollment.getStatus())
                .build();
    }
}