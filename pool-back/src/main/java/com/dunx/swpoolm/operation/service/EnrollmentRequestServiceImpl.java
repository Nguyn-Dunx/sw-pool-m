package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRequestRepository;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.repository.StudentRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentRequestServiceImpl implements EnrollmentRequestService {

    private final EnrollmentRequestRepository enrollmentRequestRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentService enrollmentService;

    @Override
    @Transactional
    public EnrollmentRequestResponse createRequest(UUID userId, EnrollmentRequestCreateDTO request) {

        // Tìm Teacher từ userId đang đăng nhập
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

        // Kiểm tra trùng: không cho tạo yêu cầu PENDING cùng kiểu bơi cho cùng học viên
        boolean isDuplicate = enrollmentRequestRepository.existsByStudentIdAndSwimStyleAndStatusIn(
                student.getId(), request.getSwimStyle(), Set.of(RequestStatus.PENDING));
        if (isDuplicate) {
            throw new AppException(MessageKeys.EnrollmentRequest.DUPLICATE_PENDING);
        }

        // Kiểm tra trùng: học viên đã có enrollment ACTIVE cùng kiểu bơi chưa
        boolean hasActiveEnrollment = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                student.getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
        if (hasActiveEnrollment) {
            throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
        }

        EnrollmentRequest enrollmentRequest = EnrollmentRequest.builder()
                .student(student)
                .teacher(teacher)
                .swimStyle(request.getSwimStyle())
                .isGuaranteed(request.getIsGuaranteed())
                .note(request.getNote())
                .status(RequestStatus.PENDING)
                .build();

        EnrollmentRequest saved = enrollmentRequestRepository.save(enrollmentRequest);
        log.info("Teacher {} đã gửi yêu cầu đăng ký khóa {} cho học viên {}",
                teacher.getFullName(), request.getSwimStyle(), student.getFullName());

        return mapToResponse(saved);
    }

    @Override
    public PageResponse<EnrollmentRequestResponse> getRequestsByTeacher(UUID userId, int page, int size) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Page<EnrollmentRequest> requestPage = enrollmentRequestRepository.findByTeacherId(teacher.getId(), pageable);

        return buildPageResponse(requestPage, page, size);
    }

    @Override
    public PageResponse<EnrollmentRequestResponse> getRequestsByStatus(RequestStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
        Page<EnrollmentRequest> requestPage = enrollmentRequestRepository.findByStatus(status, pageable);

        return buildPageResponse(requestPage, page, size);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentRequestResponse reviewRequest(UUID requestId, EnrollmentRequestReviewDTO reviewDTO) {
        EnrollmentRequest enrollmentRequest = enrollmentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.EnrollmentRequest.NOT_FOUND));

        // Chỉ được duyệt yêu cầu đang PENDING
        if (enrollmentRequest.getStatus() != RequestStatus.PENDING) {
            throw new AppException(MessageKeys.EnrollmentRequest.ALREADY_REVIEWED);
        }

        // Không cho phép set lại PENDING
        if (reviewDTO.getStatus() == RequestStatus.PENDING) {
            throw new AppException(MessageKeys.EnrollmentRequest.ALREADY_REVIEWED);
        }

        enrollmentRequest.setStatus(reviewDTO.getStatus());
        enrollmentRequest.setAdminNote(reviewDTO.getAdminNote());
        enrollmentRequest.setReviewedAt(Instant.now());

        // Nếu APPROVED → tự động tạo Enrollment
        if (reviewDTO.getStatus() == RequestStatus.APPROVED) {
            if (reviewDTO.getTeacherIds() == null || reviewDTO.getTeacherIds().isEmpty()) {
                throw new AppException(MessageKeys.Enrollment.EMPTY_TEACHERS);
            }

            EnrollmentCreateRequest createRequest = new EnrollmentCreateRequest();
            createRequest.setStudentId(enrollmentRequest.getStudent().getId());
            createRequest.setSwimStyle(enrollmentRequest.getSwimStyle());
            createRequest.setIsGuaranteed(enrollmentRequest.getIsGuaranteed());
            createRequest.setTeacherIds(reviewDTO.getTeacherIds());

            enrollmentService.createEnrollment(createRequest);

            log.info("Admin đã duyệt yêu cầu {} — Enrollment tạo tự động cho học viên {}",
                    requestId, enrollmentRequest.getStudent().getFullName());
        } else {
            log.info("Admin đã từ chối yêu cầu {} — Lý do: {}",
                    requestId, reviewDTO.getAdminNote());
        }

        EnrollmentRequest saved = enrollmentRequestRepository.save(enrollmentRequest);
        return mapToResponse(saved);
    }

    // --- Helper Methods ---

    private EnrollmentRequestResponse mapToResponse(EnrollmentRequest request) {
        return EnrollmentRequestResponse.builder()
                .id(request.getId())
                .studentName(request.getStudent().getFullName())
                .teacherName(request.getTeacher().getFullName())
                .swimStyle(request.getSwimStyle())
                .isGuaranteed(request.getIsGuaranteed())
                .note(request.getNote())
                .adminNote(request.getAdminNote())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }

    private PageResponse<EnrollmentRequestResponse> buildPageResponse(Page<EnrollmentRequest> page, int pageNum, int size) {
        List<EnrollmentRequestResponse> responses = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<EnrollmentRequestResponse>builder()
                .items(responses)
                .pageNumber(pageNum)
                .pageSize(size)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }
}
