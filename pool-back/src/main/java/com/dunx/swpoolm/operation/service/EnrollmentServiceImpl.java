package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
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
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    // Khai báo Hằng số Business Rule (Nên đưa vào bảng Config DB hoặc YML sau này)
    // TODO: FIX HARDCODE
    private static final int ENROLLMENT_DURATION_DAYS = 45;
    private static final int DEFAULT_TOTAL_QUOTA = 12;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentResponse createEnrollment(EnrollmentCreateRequest request) {

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

        boolean isDuplicate = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                student.getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
        if (isDuplicate) {
            throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
        }

        if (request.getTeacherIds() == null || request.getTeacherIds().isEmpty()) {
            throw new AppException(MessageKeys.Enrollment.EMPTY_TEACHERS);
        }

        List<Teacher> teachers = teacherRepository.findAllById(request.getTeacherIds());

        if (teachers.size() != request.getTeacherIds().size()) {
            throw new AppException(MessageKeys.Enrollment.TEACHER_NOT_FOUND);
        }

        boolean hasInactiveTeacher = teachers.stream()
                .anyMatch(t -> t.getStatus() != TeacherStatus.ACTIVE);
        if (hasInactiveTeacher) {
            throw new AppException(MessageKeys.Enrollment.TEACHER_INACTIVE);
        }

        //create
        LocalDate today = LocalDate.now();
        LocalDate expireDate = today.plusDays(ENROLLMENT_DURATION_DAYS);

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .swimStyle(request.getSwimStyle())
                .isGuaranteed(request.getIsGuaranteed())
                .startDate(today)
                .expireDate(expireDate)
                .totalQuota(DEFAULT_TOTAL_QUOTA)
                .status(EnrollmentStatus.ACTIVE)
                .teachers(new HashSet<>(teachers))
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        log.info("Khởi tạo khóa học {} cho {} thành công. Hạn: {}",
                request.getSwimStyle(), student.getFullName(), expireDate);

        List<String> teacherNames = teachers.stream().map(Teacher::getFullName).toList();

        return mapToResponse(savedEnrollment, student.getFullName(), teacherNames);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentResponse updateEnrollment(UUID enrollmentId, EnrollmentUpdateRequest request) {

        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));

        // Cập nhật danh sách giáo viên
        if (request.getTeacherIds() != null && !request.getTeacherIds().isEmpty()) {
            List<Teacher> teachers = teacherRepository.findAllById(request.getTeacherIds());
            if (teachers.size() != request.getTeacherIds().size()) {
                throw new AppException(MessageKeys.Enrollment.TEACHER_NOT_FOUND);
            }
            boolean hasInactiveTeacher = teachers.stream()
                    .anyMatch(t -> t.getStatus() != TeacherStatus.ACTIVE);
            if (hasInactiveTeacher) {
                throw new AppException(MessageKeys.Enrollment.TEACHER_INACTIVE);
            }
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

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        List<String> teacherNames = savedEnrollment.getTeachers().stream()
                .map(Teacher::getFullName).toList();

        log.info("Admin đã cập nhật Enrollment {} cho học viên {}",
                enrollmentId, enrollment.getStudent().getFullName());

        return mapToResponse(savedEnrollment, enrollment.getStudent().getFullName(), teacherNames);
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