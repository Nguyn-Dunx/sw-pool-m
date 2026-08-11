package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageRequestValidator;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.operation.dto.*;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
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

        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        EnrollmentRequest enrollmentRequest = EnrollmentRequest.builder()
                .teacher(teacher)
                .requestType(request.getRequestType())
                .isGuaranteed(request.getIsGuaranteed())
                .note(request.getNote())
                .totalQuota(request.getTotalQuota())
                .startDate(request.getStartDate())
                .expireDate(request.getExpireDate())
                .status(RequestStatus.PENDING)
                .build();

        if (request.getRequestType() == RequestType.CREATE) {
            // Logic cho CREATE
            if (request.getStudentId() == null || request.getSwimStyle() == null) {
                throw new AppException(MessageKeys.Common.BAD_REQUEST); // TODO: Add specific message key
            }

            Student student = studentRepository.findById(request.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

            boolean isDuplicate = enrollmentRequestRepository.existsByStudentIdAndSwimStyleAndStatusIn(
                    student.getId(), request.getSwimStyle(), Set.of(RequestStatus.PENDING));
            if (isDuplicate) {
                throw new AppException(MessageKeys.EnrollmentRequest.DUPLICATE_PENDING);
            }

            boolean hasActiveEnrollment = enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(
                    student.getId(), request.getSwimStyle(), EnrollmentStatus.ACTIVE);
            if (hasActiveEnrollment) {
                throw new AppException(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
            }

            enrollmentRequest.setStudent(student);
            enrollmentRequest.setSwimStyle(request.getSwimStyle());

        } else if (request.getRequestType() == RequestType.UPDATE) {
            // Logic cho UPDATE
            if (request.getTargetEnrollmentId() == null) {
                throw new AppException(MessageKeys.Common.BAD_REQUEST); // Cần có target
            }

            Enrollment targetEnrollment = enrollmentRepository.findById(request.getTargetEnrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Common.NOT_FOUND));
            
            // Không cho tạo yêu cầu update nếu khóa đã đóng/hết hạn
            if (targetEnrollment.getStatus() != EnrollmentStatus.ACTIVE) {
                 throw new AppException(MessageKeys.Enrollment.CANNOT_UPDATE_FINISHED);
            }

            // Kiểm tra trùng: không cho tạo 2 yêu cầu update cho cùng 1 khóa học
            boolean isDuplicate = enrollmentRequestRepository.existsByTargetEnrollmentIdAndStatusIn(
                    targetEnrollment.getId(), Set.of(RequestStatus.PENDING));
            if (isDuplicate) {
                 throw new AppException(MessageKeys.EnrollmentRequest.DUPLICATE_PENDING);
            }

            enrollmentRequest.setTargetEnrollment(targetEnrollment);
            enrollmentRequest.setStudent(targetEnrollment.getStudent());
            enrollmentRequest.setSwimStyle(targetEnrollment.getSwimStyle());
        }

        EnrollmentRequest saved = enrollmentRequestRepository.save(enrollmentRequest);
        log.info("Teacher {} đã gửi yêu cầu {} khóa {} cho học viên {}",
                teacher.getFullName(), request.getRequestType(), saved.getSwimStyle(), saved.getStudent().getFullName());

        return mapToResponse(saved);
    }

    @Override
    public PageResponse<EnrollmentRequestResponse> getRequestsByTeacher(UUID userId, RequestType requestType, int page, int size) {
        Teacher teacher = teacherRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        Pageable pageable = PageRequestValidator.validate(page, size, Sort.by("createdAt").descending());
        Page<EnrollmentRequest> requestPage = enrollmentRequestRepository.findByTeacherIdAndType(teacher.getId(), requestType, pageable);

        return buildPageResponse(requestPage, page, size);
    }

    @Override
    public PageResponse<EnrollmentRequestResponse> getRequestsByStatus(RequestStatus status, RequestType requestType, int page, int size) {
        Pageable pageable = PageRequestValidator.validate(page, size, Sort.by("createdAt").descending());
        Page<EnrollmentRequest> requestPage = enrollmentRequestRepository.findByStatusAndType(status, requestType, pageable);

        return buildPageResponse(requestPage, page, size);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EnrollmentRequestResponse reviewRequest(UUID requestId, EnrollmentRequestReviewDTO reviewDTO) {
        EnrollmentRequest enrollmentRequest = enrollmentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.EnrollmentRequest.NOT_FOUND));

        if (enrollmentRequest.getStatus() != RequestStatus.PENDING) {
            throw new AppException(MessageKeys.EnrollmentRequest.ALREADY_REVIEWED);
        }

        if (reviewDTO.getStatus() == RequestStatus.PENDING) {
            throw new AppException(MessageKeys.EnrollmentRequest.ALREADY_REVIEWED);
        }

        enrollmentRequest.setStatus(reviewDTO.getStatus());
        enrollmentRequest.setAdminNote(reviewDTO.getAdminNote());
        enrollmentRequest.setReviewedAt(Instant.now());

        if (reviewDTO.getStatus() == RequestStatus.APPROVED) {
            
            // Lấy values ưu tiên từ ReviewDTO (Admin sửa), nếu null thì lấy từ Request (Teacher đề xuất)
            Integer finalQuota = reviewDTO.getTotalQuota() != null ? reviewDTO.getTotalQuota() : enrollmentRequest.getTotalQuota();
            java.time.LocalDate finalStartDate = reviewDTO.getStartDate() != null ? reviewDTO.getStartDate() : enrollmentRequest.getStartDate();
            java.time.LocalDate finalExpireDate = reviewDTO.getExpireDate() != null ? reviewDTO.getExpireDate() : enrollmentRequest.getExpireDate();

            if (enrollmentRequest.getRequestType() == RequestType.CREATE) {
                if (reviewDTO.getTeacherIds() == null || reviewDTO.getTeacherIds().isEmpty()) {
                    throw new AppException(MessageKeys.Enrollment.EMPTY_TEACHERS);
                }

                EnrollmentCreateRequest createRequest = new EnrollmentCreateRequest();
                createRequest.setStudentId(enrollmentRequest.getStudent().getId());
                createRequest.setSwimStyle(enrollmentRequest.getSwimStyle());
                createRequest.setIsGuaranteed(enrollmentRequest.getIsGuaranteed());
                createRequest.setTeacherIds(reviewDTO.getTeacherIds());
                createRequest.setTotalQuota(finalQuota);
                createRequest.setStartDate(finalStartDate);
                createRequest.setExpireDate(finalExpireDate);

                enrollmentService.createEnrollment(createRequest);

            } else if (enrollmentRequest.getRequestType() == RequestType.UPDATE) {
                
                EnrollmentUpdateRequest updateRequest = new EnrollmentUpdateRequest();
                updateRequest.setTeacherIds(reviewDTO.getTeacherIds()); // Có thể null
                updateRequest.setIsGuaranteed(enrollmentRequest.getIsGuaranteed());
                updateRequest.setTotalQuota(finalQuota);
                updateRequest.setExpireDate(finalExpireDate);
                // startDate không thể sửa bằng updateEnrollment

                enrollmentService.updateEnrollment(enrollmentRequest.getTargetEnrollment().getId(), updateRequest);
            }

            log.info("Admin đã duyệt yêu cầu {} ({}) cho học viên {}",
                    requestId, enrollmentRequest.getRequestType(), enrollmentRequest.getStudent().getFullName());
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
                .requestType(request.getRequestType())
                .targetEnrollmentId(request.getTargetEnrollment() != null ? request.getTargetEnrollment().getId() : null)
                .totalQuota(request.getTotalQuota())
                .startDate(request.getStartDate())
                .expireDate(request.getExpireDate())
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
