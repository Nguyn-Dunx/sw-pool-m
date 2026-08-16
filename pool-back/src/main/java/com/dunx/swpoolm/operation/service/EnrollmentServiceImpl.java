package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageRequestValidator;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.entity.Enrollment;
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

        // Cập nhật trạng thái khóa học (Admin có quyền mở lại khóa học hoặc thay đổi trạng thái)
        if (request.getStatus() != null && request.getStatus() != enrollment.getStatus()) {
            if (request.getStatus() == EnrollmentStatus.ACTIVE) {
                SwimStyle targetStyle = request.getSwimStyle() != null ? request.getSwimStyle() : enrollment.getSwimStyle();
                boolean isDuplicate = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                        enrollment.getStudent().getId(), targetStyle, EnrollmentStatus.ACTIVE);
                if (isDuplicate) {
                    throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
                }
            }
            enrollment.setStatus(request.getStatus());
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
            if (enrollment.getStatus() == EnrollmentStatus.ACTIVE) {
                boolean isDuplicate = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                        enrollment.getStudent().getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
                if (isDuplicate) {
                    throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
                }
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

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        log.info("Khóa học của {} đã được cập nhật (Trạng thái: {})", savedEnrollment.getStudent().getFullName(), savedEnrollment.getStatus());

        return mapToResponse(savedEnrollment, savedEnrollment.getStudent().getFullName(),
                savedEnrollment.getTeachers().stream().map(Teacher::getFullName).toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeEnrollment(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        if (enrollment.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new AppException(MessageKeys.Common.BAD_REQUEST); // Tạm dùng BAD_REQUEST, sau này có thể thêm ALREADY_COMPLETED
        }

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollmentRepository.save(enrollment);
        log.info("Khóa học của {} đã được đóng (COMPLETED) thủ công", enrollment.getStudent().getFullName());
    }

    // ===================== LIST & DETAIL =====================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentResponse> getEnrollments(EnrollmentStatus status, SwimStyle swimStyle, Boolean isGuaranteed,
                                                            String studentName, UUID teacherId, int page, int size) {
        Pageable pageable = PageRequestValidator.validate(page, size);
        Page<Enrollment> enrollmentPage;

        if (teacherId != null) {
            // Filter theo teacher
            enrollmentPage = enrollmentRepository.findAllByTeacherWithFilters(teacherId, status, pageable);
        } else {
            // Filter tổng hợp
            enrollmentPage = enrollmentRepository.findAllWithFilters(status, swimStyle, isGuaranteed, studentName, pageable);
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

        List<UUID> teacherIds = enrollment.getTeachers().stream()
                .map(Teacher::getId).toList();

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