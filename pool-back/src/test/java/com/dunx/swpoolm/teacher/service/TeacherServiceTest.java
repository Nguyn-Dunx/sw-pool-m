package com.dunx.swpoolm.teacher.service;

import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.AppException;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.iam.entity.Role;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.repository.RoleRepository;
import com.dunx.swpoolm.iam.repository.UserRepository;
import com.dunx.swpoolm.teacher.dto.TeacherCreateRequest;
import com.dunx.swpoolm.teacher.dto.TeacherResponse;
import com.dunx.swpoolm.teacher.dto.TeacherUpdateRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherServiceTest {

    @Mock
    private TeacherRepository teacherRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TeacherServiceImpl teacherService;

    @Nested
    @DisplayName("createTeacher()")
    class CreateTeacherTests {

        @Test
        @DisplayName("Tạo giáo viên thành công — tạo User, hash pass, gán role, lưu profile")
        void createTeacher_success() {
            TeacherCreateRequest request = new TeacherCreateRequest();
            request.setPhoneNumber("0987654321");
            request.setPassword("password123");
            request.setFullName("Nguyen Van A");
            request.setSpecialty("Ech, Sai");

            Role teacherRole = Role.builder().id(2).roleName("ROLE_TEACHER").build();
            User savedUser = User.builder()
                    .phoneNumber(request.getPhoneNumber())
                    .passwordHash("hashed-password")
                    .role(teacherRole)
                    .isActive(true)
                    .build();
            savedUser.setId(UUID.randomUUID());

            Teacher savedTeacher = Teacher.builder()
                    .user(savedUser)
                    .fullName(request.getFullName())
                    .specialty(request.getSpecialty())
                    .status(TeacherStatus.ACTIVE)
                    .build();
            savedTeacher.setId(UUID.randomUUID());

            when(userRepository.existsByPhoneNumber(request.getPhoneNumber())).thenReturn(false);
            when(roleRepository.findByRoleName("ROLE_TEACHER")).thenReturn(Optional.of(teacherRole));
            when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed-password");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(teacherRepository.save(any(Teacher.class))).thenReturn(savedTeacher);

            TeacherResponse response = teacherService.createTeacher(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(savedTeacher.getId());
            assertThat(response.getFullName()).isEqualTo("Nguyen Van A");
            assertThat(response.getPhoneNumber()).isEqualTo("0987654321");
            assertThat(response.getStatus()).isEqualTo(TeacherStatus.ACTIVE);

            verify(userRepository).save(any(User.class));
            verify(teacherRepository).save(any(Teacher.class));
        }

        @Test
        @DisplayName("Trùng số điện thoại — ném AppException PHONE_EXISTS")
        void createTeacher_phoneExists_throwsAppException() {
            TeacherCreateRequest request = new TeacherCreateRequest();
            request.setPhoneNumber("0987654321");

            when(userRepository.existsByPhoneNumber(request.getPhoneNumber())).thenReturn(true);

            AppException ex = assertThrows(AppException.class, () -> teacherService.createTeacher(request));
            assertThat(ex.getMessageKey()).isEqualTo(MessageKeys.User.PHONE_EXISTS);

            verify(userRepository, never()).save(any());
            verify(teacherRepository, never()).save(any());
        }

        @Test
        @DisplayName("Không tìm thấy ROLE_TEACHER — ném ResourceNotFoundException")
        void createTeacher_roleNotFound_throwsException() {
            TeacherCreateRequest request = new TeacherCreateRequest();
            request.setPhoneNumber("0987654321");

            when(userRepository.existsByPhoneNumber(request.getPhoneNumber())).thenReturn(false);
            when(roleRepository.findByRoleName("ROLE_TEACHER")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> teacherService.createTeacher(request));
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getTeachers()")
    class GetTeachersTests {

        @Test
        @DisplayName("Lấy danh sách giáo viên có phân trang")
        void getTeachers_returnsPagedResponse() {
            User user = User.builder().phoneNumber("0987654321").build();
            Teacher teacher = Teacher.builder()
                    .user(user)
                    .fullName("Nguyen Van A")
                    .specialty("Boi buom")
                    .status(TeacherStatus.ACTIVE)
                    .build();
            teacher.setId(UUID.randomUUID());

            Page<Teacher> page = new PageImpl<>(List.of(teacher));
            when(teacherRepository.searchTeachers(anyString(), any(), any(Pageable.class))).thenReturn(page);

            PageResponse<TeacherResponse> response = teacherService.getTeachers("Nguyen", null, 1, 10);

            assertThat(response).isNotNull();
            assertThat(response.getItems()).hasSize(1);
            assertThat(response.getItems().get(0).getFullName()).isEqualTo("Nguyen Van A");
            assertThat(response.getTotalElements()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("updateTeacher()")
    class UpdateTeacherTests {

        @Test
        @DisplayName("Cập nhật thông tin giáo viên thành công")
        void updateTeacher_success() {
            UUID id = UUID.randomUUID();
            User user = User.builder().phoneNumber("0987654321").build();
            Teacher existingTeacher = Teacher.builder()
                    .user(user)
                    .fullName("Old Name")
                    .specialty("Ech")
                    .status(TeacherStatus.ACTIVE)
                    .build();
            existingTeacher.setId(id);

            TeacherUpdateRequest request = new TeacherUpdateRequest();
            request.setFullName("New Name");
            request.setSpecialty("Sai, Buom");
            request.setStatus(TeacherStatus.INACTIVE);

            when(teacherRepository.findById(id)).thenReturn(Optional.of(existingTeacher));
            when(teacherRepository.save(any(Teacher.class))).thenAnswer(i -> i.getArgument(0));

            TeacherResponse response = teacherService.updateTeacher(id, request);

            assertThat(response).isNotNull();
            assertThat(response.getFullName()).isEqualTo("New Name");
            assertThat(response.getSpecialty()).isEqualTo("Sai, Buom");
            assertThat(response.getStatus()).isEqualTo(TeacherStatus.INACTIVE);
        }

        @Test
        @DisplayName("Không tìm thấy giáo viên khi cập nhật — ném ResourceNotFoundException")
        void updateTeacher_notFound_throwsException() {
            UUID id = UUID.randomUUID();
            TeacherUpdateRequest request = new TeacherUpdateRequest();

            when(teacherRepository.findById(id)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> teacherService.updateTeacher(id, request));
        }
    }

    @Nested
    @DisplayName("deleteTeacher()")
    class DeleteTeacherTests {

        @Test
        @DisplayName("Xóa giáo viên thành công")
        void deleteTeacher_success() {
            UUID id = UUID.randomUUID();
            Teacher teacher = Teacher.builder().fullName("Teacher A").build();
            teacher.setId(id);

            when(teacherRepository.findById(id)).thenReturn(Optional.of(teacher));

            teacherService.deleteTeacher(id);

            verify(teacherRepository).delete(teacher);
        }
    }
}
