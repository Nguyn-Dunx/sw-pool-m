package com.dunx.swpoolm.student.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.student.dto.StudentCreateRequest;
import com.dunx.swpoolm.student.dto.StudentResponse;
import com.dunx.swpoolm.student.dto.StudentUpdateRequest;
import com.dunx.swpoolm.student.dto.TeacherStudentCreateRequest;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.enums.SourceType;
import com.dunx.swpoolm.student.repository.StudentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentServiceImpl studentService;

    @Nested
    @DisplayName("createStudent() - Admin")
    class CreateStudentAdminTests {

        @Test
        @DisplayName("Admin tạo học viên với nguồn POOL thành công")
        void createStudent_byAdmin_success() {
            StudentCreateRequest request = new StudentCreateRequest();
            request.setFullName("Nguyen Van Hoc Vien");
            request.setPhoneNumber("0912345678");
            request.setDob(LocalDate.of(2010, 5, 20));
            request.setSourceType(SourceType.POOL);

            Student saved = Student.builder()
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .dob(request.getDob())
                    .sourceType(SourceType.POOL)
                    .build();
            saved.setId(UUID.randomUUID());

            when(studentRepository.save(any(Student.class))).thenReturn(saved);

            StudentResponse response = studentService.createStudent(request);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("Nguyen Van Hoc Vien");
            assertThat(response.getSourceType()).isEqualTo(SourceType.POOL);
            verify(studentRepository).save(any(Student.class));
        }
    }

    @Nested
    @DisplayName("createStudentByTeacher() - Teacher")
    class CreateStudentTeacherTests {

        @Test
        @DisplayName("Teacher tạo học viên — tự động gán sourceType = TEACHER")
        void createStudent_byTeacher_forcesSourceTypeTeacher() {
            TeacherStudentCreateRequest request = new TeacherStudentCreateRequest();
            request.setFullName("Tran Thi B");
            request.setPhoneNumber("0933333333");
            request.setDob(LocalDate.of(2012, 8, 15));

            Student saved = Student.builder()
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .dob(request.getDob())
                    .sourceType(SourceType.TEACHER)
                    .build();
            saved.setId(UUID.randomUUID());

            when(studentRepository.save(any(Student.class))).thenReturn(saved);

            StudentResponse response = studentService.createStudentByTeacher(request);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("Tran Thi B");
            assertThat(response.getSourceType()).isEqualTo(SourceType.TEACHER);
        }
    }

    @Nested
    @DisplayName("getStudents()")
    class GetStudentsTests {

        @Test
        @DisplayName("Tìm kiếm học viên phân trang")
        void getStudents_returnsPagedResponse() {
            Student student = Student.builder()
                    .fullName("Le Van C")
                    .phoneNumber("0944444444")
                    .sourceType(SourceType.POOL)
                    .dob(LocalDate.of(2005, 1, 1))
                    .build();
            student.setId(UUID.randomUUID());

            Page<Student> page = new PageImpl<>(List.of(student));
            when(studentRepository.searchStudents(anyString(), any(), any(Pageable.class))).thenReturn(page);

            PageResponse<StudentResponse> response = studentService.getStudents("Le", null, 1, 10);

            assertThat(response).isNotNull();
            assertThat(response.getItems()).hasSize(1);
            assertThat(response.getItems().get(0).getFullName()).isEqualTo("Le Van C");
        }
    }

    @Nested
    @DisplayName("updateStudent()")
    class UpdateStudentTests {

        @Test
        @DisplayName("Cập nhật thông tin học viên thành công")
        void updateStudent_success() {
            UUID id = UUID.randomUUID();
            Student existing = Student.builder()
                    .fullName("Old Name")
                    .phoneNumber("0911111111")
                    .sourceType(SourceType.POOL)
                    .dob(LocalDate.of(2000, 1, 1))
                    .build();
            existing.setId(id);

            StudentUpdateRequest request = new StudentUpdateRequest();
            request.setFullName("Updated Name");
            request.setPhoneNumber("0922222222");
            request.setSourceType(SourceType.TEACHER);
            request.setDob(LocalDate.of(2001, 2, 2));

            when(studentRepository.findById(id)).thenReturn(Optional.of(existing));
            when(studentRepository.save(any(Student.class))).thenAnswer(i -> i.getArgument(0));

            StudentResponse response = studentService.updateStudent(id, request);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("Updated Name");
            assertThat(response.getPhoneNumber()).isEqualTo("0922222222");
            assertThat(response.getSourceType()).isEqualTo(SourceType.TEACHER);
        }

        @Test
        @DisplayName("Cập nhật học viên không tồn tại — ném ResourceNotFoundException")
        void updateStudent_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            StudentUpdateRequest request = new StudentUpdateRequest();

            when(studentRepository.findById(id)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> studentService.updateStudent(id, request));
        }
    }

    @Nested
    @DisplayName("deleteStudent()")
    class DeleteStudentTests {

        @Test
        @DisplayName("Xóa học viên thành công")
        void deleteStudent_success() {
            UUID id = UUID.randomUUID();
            Student student = Student.builder().fullName("Student D").build();
            student.setId(id);

            when(studentRepository.findById(id)).thenReturn(Optional.of(student));

            studentService.deleteStudent(id);

            verify(studentRepository).delete(student);
        }
    }
}
