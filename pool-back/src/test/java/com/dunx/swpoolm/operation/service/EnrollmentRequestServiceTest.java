package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestCreateDTO;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentRequestReviewDTO;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;
import com.dunx.swpoolm.operation.entity.Enrollment;
import com.dunx.swpoolm.operation.entity.EnrollmentRequest;
import com.dunx.swpoolm.operation.enums.EnrollmentStatus;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRequestRepository;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.repository.StudentRepository;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentRequestServiceTest {

    @Mock
    private EnrollmentRequestRepository enrollmentRequestRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private EnrollmentService enrollmentService;

    @InjectMocks
    private EnrollmentRequestServiceImpl enrollmentRequestService;

    private final UUID userId = UUID.randomUUID();
    private final UUID teacherId = UUID.randomUUID();
    private final UUID studentId = UUID.randomUUID();

    private Teacher createTeacher() {
        Teacher t = Teacher.builder().fullName("Teacher A").status(TeacherStatus.ACTIVE).build();
        t.setId(teacherId);
        return t;
    }

    private Student createStudent() {
        Student s = Student.builder().fullName("Student A").build();
        s.setId(studentId);
        return s;
    }

    @Nested
    @DisplayName("createRequest() - Teacher")
    class CreateRequestTests {

        @Test
        @DisplayName("Tạo yêu cầu CREATE thành công (status = PENDING)")
        void createRequest_createType_success() {
            Teacher teacher = createTeacher();
            Student student = createStudent();

            EnrollmentRequestCreateDTO dto = new EnrollmentRequestCreateDTO();
            dto.setRequestType(RequestType.CREATE);
            dto.setStudentId(studentId);
            dto.setSwimStyle(SwimStyle.FROG);
            dto.setIsGuaranteed(true);
            dto.setTotalQuota(12);
            dto.setStartDate(LocalDate.of(2026, 1, 1));
            dto.setExpireDate(LocalDate.of(2026, 2, 15));
            dto.setNote("De xuat khoa moi");

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(enrollmentRequestRepository.save(any(EnrollmentRequest.class))).thenAnswer(i -> {
                EnrollmentRequest req = i.getArgument(0);
                req.setId(UUID.randomUUID());
                return req;
            });

            EnrollmentRequestResponse response = enrollmentRequestService.createRequest(userId, dto);

            assertThat(response).isNotNull();
            assertThat(response.getRequestType()).isEqualTo(RequestType.CREATE);
            assertThat(response.getStatus()).isEqualTo(RequestStatus.PENDING);
            assertThat(response.getStudentName()).isEqualTo("Student A");
            assertThat(response.getTeacherName()).isEqualTo("Teacher A");
            verify(enrollmentRequestRepository).save(any(EnrollmentRequest.class));
        }

        @Test
        @DisplayName("Tạo yêu cầu UPDATE thành công khi giáo viên đang phụ trách khóa học")
        void createRequest_updateType_success() {
            Teacher teacher = createTeacher();
            Student student = createStudent();
            UUID enrollmentId = UUID.randomUUID();

            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            enrollment.setId(enrollmentId);

            EnrollmentRequestCreateDTO dto = new EnrollmentRequestCreateDTO();
            dto.setRequestType(RequestType.UPDATE);
            dto.setTargetEnrollmentId(enrollmentId);
            dto.setSwimStyle(SwimStyle.FREE);
            dto.setIsGuaranteed(false);
            dto.setNote("Doi sang boi sai");

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(enrollmentRequestRepository.save(any(EnrollmentRequest.class))).thenAnswer(i -> {
                EnrollmentRequest req = i.getArgument(0);
                req.setId(UUID.randomUUID());
                return req;
            });

            EnrollmentRequestResponse response = enrollmentRequestService.createRequest(userId, dto);

            assertThat(response).isNotNull();
            assertThat(response.getRequestType()).isEqualTo(RequestType.UPDATE);
            assertThat(response.getTargetEnrollmentId()).isEqualTo(enrollmentId);
        }
    }

    @Nested
    @DisplayName("reviewRequest() - Admin")
    class ReviewRequestTests {

        @Test
        @DisplayName("Duyệt APPROVED yêu cầu CREATE — tự động gọi enrollmentService.createEnrollment")
        void reviewRequest_approvedCreate_createsEnrollment() {
            UUID requestId = UUID.randomUUID();
            Teacher teacher = createTeacher();
            Student student = createStudent();

            EnrollmentRequest request = EnrollmentRequest.builder()
                    .student(student)
                    .teacher(teacher)
                    .requestType(RequestType.CREATE)
                    .status(RequestStatus.PENDING)
                    .swimStyle(SwimStyle.FROG)
                    .isGuaranteed(true)
                    .totalQuota(12)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .expireDate(LocalDate.of(2026, 2, 15))
                    .build();
            request.setId(requestId);

            EnrollmentRequestReviewDTO reviewDTO = new EnrollmentRequestReviewDTO();
            reviewDTO.setStatus(RequestStatus.APPROVED);
            reviewDTO.setAdminNote("Dong y duyet");
            reviewDTO.setTeacherIds(Set.of(teacher.getId()));

            when(enrollmentRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
            when(enrollmentRequestRepository.save(any(EnrollmentRequest.class))).thenAnswer(i -> i.getArgument(0));

            EnrollmentRequestResponse response = enrollmentRequestService.reviewRequest(requestId, reviewDTO);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(RequestStatus.APPROVED);
            assertThat(response.getAdminNote()).isEqualTo("Dong y duyet");

            verify(enrollmentService).createEnrollment(any(EnrollmentCreateRequest.class));
            verify(enrollmentRequestRepository).save(request);
        }

        @Test
        @DisplayName("Duyệt APPROVED yêu cầu UPDATE — gọi enrollmentService.updateEnrollment")
        void reviewRequest_approvedUpdate_updatesTargetEnrollment() {
            UUID requestId = UUID.randomUUID();
            UUID enrollmentId = UUID.randomUUID();
            Teacher teacher = createTeacher();
            Student student = createStudent();

            Enrollment targetEnrollment = Enrollment.builder()
                    .student(student)
                    .swimStyle(SwimStyle.FROG)
                    .status(EnrollmentStatus.ACTIVE)
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            targetEnrollment.setId(enrollmentId);

            EnrollmentRequest request = EnrollmentRequest.builder()
                    .student(student)
                    .teacher(teacher)
                    .targetEnrollment(targetEnrollment)
                    .requestType(RequestType.UPDATE)
                    .status(RequestStatus.PENDING)
                    .swimStyle(SwimStyle.FREE)
                    .isGuaranteed(false)
                    .totalQuota(14)
                    .expireDate(LocalDate.of(2026, 3, 1))
                    .build();
            request.setId(requestId);

            EnrollmentRequestReviewDTO reviewDTO = new EnrollmentRequestReviewDTO();
            reviewDTO.setStatus(RequestStatus.APPROVED);
            reviewDTO.setAdminNote("Ok update");

            when(enrollmentRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
            when(enrollmentRequestRepository.save(any(EnrollmentRequest.class))).thenAnswer(i -> i.getArgument(0));

            EnrollmentRequestResponse response = enrollmentRequestService.reviewRequest(requestId, reviewDTO);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(RequestStatus.APPROVED);
            verify(enrollmentService).updateEnrollment(eq(enrollmentId), any(EnrollmentUpdateRequest.class));
        }

        @Test
        @DisplayName("Từ chối REJECTED — chỉ đổi trạng thái request, không gọi enrollmentService")
        void reviewRequest_rejected_onlyUpdatesRequest() {
            UUID requestId = UUID.randomUUID();
            Teacher teacher = createTeacher();
            Student student = createStudent();

            EnrollmentRequest request = EnrollmentRequest.builder()
                    .student(student)
                    .teacher(teacher)
                    .requestType(RequestType.CREATE)
                    .status(RequestStatus.PENDING)
                    .build();
            request.setId(requestId);

            EnrollmentRequestReviewDTO reviewDTO = new EnrollmentRequestReviewDTO();
            reviewDTO.setStatus(RequestStatus.REJECTED);
            reviewDTO.setAdminNote("Lop da day");

            when(enrollmentRequestRepository.findById(requestId)).thenReturn(Optional.of(request));
            when(enrollmentRequestRepository.save(any(EnrollmentRequest.class))).thenAnswer(i -> i.getArgument(0));

            EnrollmentRequestResponse response = enrollmentRequestService.reviewRequest(requestId, reviewDTO);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(response.getAdminNote()).isEqualTo("Lop da day");

            verify(enrollmentService, never()).createEnrollment(any());
            verify(enrollmentService, never()).updateEnrollment(any(), any());
        }
    }
}
