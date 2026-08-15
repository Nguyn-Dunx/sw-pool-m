package com.dunx.swpoolm.operation.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.setting.service.SettingService;
import com.dunx.swpoolm.operation.dto.EnrollmentCreateRequest;
import com.dunx.swpoolm.operation.dto.EnrollmentDetailResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentResponse;
import com.dunx.swpoolm.operation.dto.EnrollmentUpdateRequest;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private SettingService settingService;

    @InjectMocks
    private EnrollmentServiceImpl enrollmentService;

    private Student createStudent(UUID id, String name) {
        Student s = Student.builder().fullName(name).build();
        s.setId(id);
        return s;
    }

    private Teacher createTeacher(UUID id, String name) {
        Teacher t = Teacher.builder().fullName(name).status(TeacherStatus.ACTIVE).build();
        t.setId(id);
        return t;
    }

    @Nested
    @DisplayName("createEnrollment()")
    class CreateEnrollmentTests {

        @Test
        @DisplayName("Tạo khóa học thành công khi điền đủ tham số tùy chỉnh")
        void createEnrollment_withCustomParams_success() {
            UUID studentId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();

            Student student = createStudent(studentId, "Hoc Vien 1");
            Teacher teacher = createTeacher(teacherId, "Giao Vien 1");

            EnrollmentCreateRequest request = new EnrollmentCreateRequest();
            request.setStudentId(studentId);
            request.setTeacherIds(Set.of(teacherId));
            request.setSwimStyle(SwimStyle.FROG);
            request.setIsGuaranteed(true);
            request.setTotalQuota(15);
            request.setStartDate(LocalDate.of(2026, 1, 1));
            request.setExpireDate(LocalDate.of(2026, 3, 1));

            when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(studentId, SwimStyle.FROG, EnrollmentStatus.ACTIVE)).thenReturn(false);
            when(teacherRepository.findAllById(request.getTeacherIds())).thenReturn(List.of(teacher));
            when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> {
                Enrollment e = i.getArgument(0);
                e.setId(UUID.randomUUID());
                return e;
            });

            EnrollmentResponse response = enrollmentService.createEnrollment(request);

            assertThat(response).isNotNull();
            assertThat(response.getStudentName()).isEqualTo("Hoc Vien 1");
            assertThat(response.getSwimStyle()).isEqualTo(SwimStyle.FROG);
            assertThat(response.getTotalQuota()).isEqualTo(15);
            assertThat(response.getIsGuaranteed()).isTrue();
            assertThat(response.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
            verify(enrollmentRepository).save(any(Enrollment.class));
        }

        @Test
        @DisplayName("Tạo khóa học thành công với fallback giá trị mặc định từ Settings")
        void createEnrollment_withFallbackSettings_success() {
            UUID studentId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();

            Student student = createStudent(studentId, "Hoc Vien 2");
            Teacher teacher = createTeacher(teacherId, "Giao Vien 2");

            EnrollmentCreateRequest request = new EnrollmentCreateRequest();
            request.setStudentId(studentId);
            request.setTeacherIds(Set.of(teacherId));
            request.setSwimStyle(SwimStyle.FREE);
            request.setIsGuaranteed(false);

            when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(studentId, SwimStyle.FREE, EnrollmentStatus.ACTIVE)).thenReturn(false);
            when(teacherRepository.findAllById(request.getTeacherIds())).thenReturn(List.of(teacher));
            when(settingService.getInt("enrollment.default-quota")).thenReturn(12);
            when(settingService.getInt("enrollment.duration-days")).thenReturn(45);
            when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> {
                Enrollment e = i.getArgument(0);
                e.setId(UUID.randomUUID());
                return e;
            });

            EnrollmentResponse response = enrollmentService.createEnrollment(request);

            assertThat(response).isNotNull();
            assertThat(response.getTotalQuota()).isEqualTo(12);
            assertThat(response.getStartDate()).isEqualTo(LocalDate.now());
            assertThat(response.getExpireDate()).isEqualTo(LocalDate.now().plusDays(45));
        }

        @Test
        @DisplayName("Trùng kiểu bơi đang học ACTIVE — ném DUPLICATE_ACTIVE_STYLE")
        void createEnrollment_duplicateActiveStyle_throwsAppException() {
            UUID studentId = UUID.randomUUID();
            Student student = createStudent(studentId, "Student");

            EnrollmentCreateRequest request = new EnrollmentCreateRequest();
            request.setStudentId(studentId);
            request.setSwimStyle(SwimStyle.FROG);

            when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(studentId, SwimStyle.FROG, EnrollmentStatus.ACTIVE)).thenReturn(true);

            AppException ex = assertThrows(AppException.class, () -> enrollmentService.createEnrollment(request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Enrollment.DUPLICATE_ACTIVE_STYLE);
        }

        @Test
        @DisplayName("Ngày hết hạn nhỏ hơn ngày bắt đầu — ném INVALID_DATES")
        void createEnrollment_invalidDates_throwsAppException() {
            UUID studentId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();
            Student student = createStudent(studentId, "Student");
            Teacher teacher = createTeacher(teacherId, "Teacher");

            EnrollmentCreateRequest request = new EnrollmentCreateRequest();
            request.setStudentId(studentId);
            request.setTeacherIds(Set.of(teacherId));
            request.setSwimStyle(SwimStyle.BACK);
            request.setStartDate(LocalDate.of(2026, 5, 10));
            request.setExpireDate(LocalDate.of(2026, 5, 1)); // Invalid: expire < start

            when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
            when(enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(any(), any(), any())).thenReturn(false);
            when(teacherRepository.findAllById(any())).thenReturn(List.of(teacher));

            AppException ex = assertThrows(AppException.class, () -> enrollmentService.createEnrollment(request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Enrollment.INVALID_DATES);
        }
    }

    @Nested
    @DisplayName("updateEnrollment()")
    class UpdateEnrollmentTests {

        @Test
        @DisplayName("Cập nhật khóa học thành công")
        void updateEnrollment_success() {
            UUID enrollmentId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();

            Student student = createStudent(UUID.randomUUID(), "Student X");
            Teacher teacher = createTeacher(teacherId, "Teacher Y");

            Enrollment existing = Enrollment.builder()
                    .student(student)
                    .status(EnrollmentStatus.ACTIVE)
                    .swimStyle(SwimStyle.FROG)
                    .isGuaranteed(false)
                    .totalQuota(12)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .expireDate(LocalDate.of(2026, 2, 15))
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            existing.setId(enrollmentId);

            EnrollmentUpdateRequest request = new EnrollmentUpdateRequest();
            request.setSwimStyle(SwimStyle.FREE);
            request.setIsGuaranteed(true);
            request.setTotalQuota(16);
            request.setExpireDate(LocalDate.of(2026, 3, 1));
            request.setTeacherIds(Set.of(teacherId));

            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(existing));
            when(teacherRepository.findAllById(Set.of(teacherId))).thenReturn(List.of(teacher));
            when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

            EnrollmentResponse response = enrollmentService.updateEnrollment(enrollmentId, request);

            assertThat(response).isNotNull();
            assertThat(response.getSwimStyle()).isEqualTo(SwimStyle.FREE);
            assertThat(response.getIsGuaranteed()).isTrue();
            assertThat(response.getTotalQuota()).isEqualTo(16);
        }

        @Test
        @DisplayName("Admin có thể cập nhật trạng thái mở lại khóa học từ COMPLETED sang ACTIVE")
        void updateEnrollment_reopenCompleted_success() {
            UUID enrollmentId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();

            Student student = createStudent(UUID.randomUUID(), "Student X");
            Teacher teacher = createTeacher(teacherId, "Teacher Y");

            Enrollment finished = Enrollment.builder()
                    .student(student)
                    .status(EnrollmentStatus.COMPLETED)
                    .swimStyle(SwimStyle.FROG)
                    .isGuaranteed(false)
                    .totalQuota(12)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .expireDate(LocalDate.of(2026, 2, 15))
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            finished.setId(enrollmentId);

            EnrollmentUpdateRequest request = new EnrollmentUpdateRequest();
            request.setStatus(EnrollmentStatus.ACTIVE);

            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(finished));
            when(enrollmentRepository.existsByStudentIdAndSwimStyleAndStatus(student.getId(), SwimStyle.FROG, EnrollmentStatus.ACTIVE))
                    .thenReturn(false);
            when(enrollmentRepository.save(any(Enrollment.class))).thenAnswer(i -> i.getArgument(0));

            EnrollmentResponse response = enrollmentService.updateEnrollment(enrollmentId, request);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(EnrollmentStatus.ACTIVE);
        }
    }

    @Nested
    @DisplayName("completeEnrollment()")
    class CompleteEnrollmentTests {

        @Test
        @DisplayName("Đóng khóa học thành công")
        void completeEnrollment_success() {
            UUID id = UUID.randomUUID();
            Student student = createStudent(UUID.randomUUID(), "Student 1");
            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .status(EnrollmentStatus.ACTIVE)
                    .build();
            enrollment.setId(id);

            when(enrollmentRepository.findById(id)).thenReturn(Optional.of(enrollment));

            enrollmentService.completeEnrollment(id);

            assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
            verify(enrollmentRepository).save(enrollment);
        }
    }

    @Nested
    @DisplayName("getEnrollmentDetail()")
    class GetEnrollmentDetailTests {

        @Test
        @DisplayName("Lấy chi tiết khóa học kèm danh sách ID giáo viên và lịch sử điểm danh")
        void getEnrollmentDetail_success() {
            UUID id = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();
            Student student = Student.builder().fullName("Student Z").phoneNumber("0912345678").dob(LocalDate.of(2010, 1, 1)).build();
            student.setId(UUID.randomUUID());
            Teacher teacher = createTeacher(teacherId, "Teacher T");

            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .swimStyle(SwimStyle.FLY)
                    .isGuaranteed(true)
                    .totalQuota(12)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .expireDate(LocalDate.of(2026, 2, 15))
                    .status(EnrollmentStatus.ACTIVE)
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            enrollment.setId(id);

            when(enrollmentRepository.findById(id)).thenReturn(Optional.of(enrollment));
            when(attendanceRecordRepository.countByEnrollmentId(id)).thenReturn(5L);
            when(attendanceRecordRepository.findByEnrollmentIdOrderByAttendDateDesc(id)).thenReturn(List.of());

            EnrollmentDetailResponse response = enrollmentService.getEnrollmentDetail(id);

            assertThat(response).isNotNull();
            assertThat(response.getStudentName()).isEqualTo("Student Z");
            assertThat(response.getTeacherNames()).contains("Teacher T");
            assertThat(response.getTeacherIds()).contains(teacherId);
            assertThat(response.getAttendedSessions()).isEqualTo(5);
            assertThat(response.getStudentPhone()).isEqualTo("0912345678");
        }
    }
}
