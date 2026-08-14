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
import com.dunx.swpoolm.operation.enums.ShiftPeriod;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.operation.repository.AttendanceRecordRepository;
import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import com.dunx.swpoolm.operation.repository.ShiftRepository;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.teacher.entity.Teacher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherOperationServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private TeacherRepository teacherRepository;

    @InjectMocks
    private TeacherOperationServiceImpl teacherOperationService;

    @Nested
    @DisplayName("checkInStudent()")
    class CheckInStudentTests {

        private final UUID userId = UUID.randomUUID();
        private final UUID teacherId = UUID.randomUUID();
        private final UUID enrollmentId = UUID.randomUUID();
        private final Integer shiftId = 1;

        private Teacher createTeacher(UUID id, String name) {
            Teacher t = Teacher.builder().fullName(name).build();
            t.setId(id);
            return t;
        }

        private Shift createShift() {
            return Shift.builder()
                    .id(shiftId)
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(9, 30))
                    .period(ShiftPeriod.MORNING)
                    .build();
        }

        private Enrollment createEnrollment(Teacher teacher, boolean isGuaranteed, int totalQuota) {
            Student student = Student.builder().fullName("Student A").build();
            student.setId(UUID.randomUUID());
            Enrollment e = Enrollment.builder()
                    .student(student)
                    .swimStyle(SwimStyle.FROG)
                    .isGuaranteed(isGuaranteed)
                    .totalQuota(totalQuota)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .expireDate(LocalDate.of(2026, 2, 15))
                    .status(EnrollmentStatus.ACTIVE)
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            e.setId(enrollmentId);
            return e;
        }

        @Test
        @DisplayName("Điểm danh thành công — số buổi tăng lên")
        void checkIn_success() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));
            request.setNote("Buoi 1 tap tot");

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));
            when(attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(enrollmentId, shiftId, request.getAttendDate())).thenReturn(false);
            when(attendanceRepository.countByEnrollmentId(enrollmentId)).thenReturn(3L);
            when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(i -> {
                AttendanceRecord r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            AttendanceResponse response = teacherOperationService.checkInStudent(userId, request);

            assertThat(response).isNotNull();
            assertThat(response.getCurrentSessionCount()).isEqualTo(4);
            assertThat(response.getStudentName()).isEqualTo("Student A");
            verify(attendanceRepository).save(any(AttendanceRecord.class));
        }

        @Test
        @DisplayName("Giáo viên không được phân công dạy khóa học này — ném UNAUTHORIZED")
        void checkIn_unauthorizedTeacher_throwsAppException() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Teacher anotherTeacher = createTeacher(UUID.randomUUID(), "Another");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(anotherTeacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));

            AppException ex = assertThrows(AppException.class, () -> teacherOperationService.checkInStudent(userId, request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Attendance.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Ngày điểm danh ngoài khoảng thời gian khóa học — ném INVALID_DATE")
        void checkIn_dateOutOfRange_throwsAppException() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 3, 1)); // Out of range

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));

            AppException ex = assertThrows(AppException.class, () -> teacherOperationService.checkInStudent(userId, request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Attendance.INVALID_DATE);
        }

        @Test
        @DisplayName("Điểm danh trùng cùng ca trong ngày — ném DUPLICATE")
        void checkIn_duplicateShiftSameDay_throwsAppException() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));
            when(attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(enrollmentId, shiftId, request.getAttendDate())).thenReturn(true);

            AppException ex = assertThrows(AppException.class, () -> teacherOperationService.checkInStudent(userId, request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Attendance.DUPLICATE);
        }

        @Test
        @DisplayName("Hết số buổi của gói KHÔNG cam kết — ném QUOTA_EXCEEDED")
        void checkIn_quotaExceeded_notGuaranteed_throwsAppException() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));
            when(attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(enrollmentId, shiftId, request.getAttendDate())).thenReturn(false);
            when(attendanceRepository.countByEnrollmentId(enrollmentId)).thenReturn(12L);

            AppException ex = assertThrows(AppException.class, () -> teacherOperationService.checkInStudent(userId, request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Attendance.QUOTA_EXCEEDED);
        }

        @Test
        @DisplayName("Gói CÓ cam kết cho phép học bù vượt quá quota tiêu chuẩn")
        void checkIn_quotaExceeded_guaranteed_allowsCheckIn() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, true, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));
            when(attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(enrollmentId, shiftId, request.getAttendDate())).thenReturn(false);
            when(attendanceRepository.countByEnrollmentId(enrollmentId)).thenReturn(12L);
            when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(i -> {
                AttendanceRecord r = i.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });

            AttendanceResponse response = teacherOperationService.checkInStudent(userId, request);

            assertThat(response).isNotNull();
            assertThat(response.getCurrentSessionCount()).isEqualTo(13);
        }

        @Test
        @DisplayName("Tự động chuyển trạng thái COMPLETED khi điểm danh buổi cuối cùng của gói không cam kết")
        void checkIn_autoCompletesEnrollment_whenQuotaReached_andNotGuaranteed() {
            Teacher teacher = createTeacher(teacherId, "Teacher A");
            Shift shift = createShift();
            Enrollment enrollment = createEnrollment(teacher, false, 12);

            AttendanceCreateRequest request = new AttendanceCreateRequest();
            request.setEnrollmentId(enrollmentId);
            request.setShiftId(shiftId);
            request.setAttendDate(LocalDate.of(2026, 1, 10));

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
            when(shiftRepository.findById(shiftId)).thenReturn(Optional.of(shift));
            when(attendanceRepository.existsByEnrollmentIdAndShiftIdAndAttendDate(enrollmentId, shiftId, request.getAttendDate())).thenReturn(false);
            when(attendanceRepository.countByEnrollmentId(enrollmentId)).thenReturn(11L);
            when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(i -> i.getArgument(0));

            teacherOperationService.checkInStudent(userId, request);

            assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
            verify(enrollmentRepository).save(enrollment);
        }
    }

    @Nested
    @DisplayName("completeEnrollment() - Teacher")
    class CompleteEnrollmentTests {

        @Test
        @DisplayName("Giáo viên đóng khóa học phụ trách thành công")
        void completeEnrollment_success() {
            UUID userId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();
            UUID enrollmentId = UUID.randomUUID();

            Teacher teacher = Teacher.builder().fullName("Teacher A").build();
            teacher.setId(teacherId);

            Student student = Student.builder().fullName("Student A").build();
            student.setId(UUID.randomUUID());

            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .status(EnrollmentStatus.ACTIVE)
                    .teachers(new HashSet<>(List.of(teacher)))
                    .build();
            enrollment.setId(enrollmentId);

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

            teacherOperationService.completeEnrollment(userId, enrollmentId);

            assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
            verify(enrollmentRepository).save(enrollment);
        }

        @Test
        @DisplayName("Giáo viên không phụ trách khóa học không được phép đóng — ném UNAUTHORIZED")
        void completeEnrollment_unauthorized_throwsAppException() {
            UUID userId = UUID.randomUUID();
            UUID teacherId = UUID.randomUUID();
            UUID otherTeacherId = UUID.randomUUID();
            UUID enrollmentId = UUID.randomUUID();

            Teacher teacher = Teacher.builder().fullName("Teacher A").build();
            teacher.setId(teacherId);
            Teacher otherTeacher = Teacher.builder().fullName("Other Teacher").build();
            otherTeacher.setId(otherTeacherId);

            Enrollment enrollment = Enrollment.builder()
                    .teachers(new HashSet<>(List.of(otherTeacher)))
                    .build();
            enrollment.setId(enrollmentId);

            when(teacherRepository.findByUserId(userId)).thenReturn(Optional.of(teacher));
            when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

            AppException ex = assertThrows(AppException.class, () -> teacherOperationService.completeEnrollment(userId, enrollmentId));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.Attendance.UNAUTHORIZED);
        }
    }
}
