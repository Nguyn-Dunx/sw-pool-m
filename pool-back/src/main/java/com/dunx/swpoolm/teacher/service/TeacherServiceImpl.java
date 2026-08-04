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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ROLE_TEACHER_NAME = "ROLE_TEACHER";

    @Override
    @Transactional(rollbackFor = Exception.class) // CỰC KỲ QUAN TRỌNG: Rollback mọi exception
    public TeacherResponse createTeacher(TeacherCreateRequest request) {

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new AppException(MessageKeys.User.PHONE_EXISTS);
        }

        Role teacherRole = roleRepository.findByRoleName(ROLE_TEACHER_NAME)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Role.NOT_FOUND));

        User newUser = User.builder()
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(teacherRole)
                .isActive(true)
                .build();
        User savedUser = userRepository.save(newUser);

        log.info("Tạo thành công User cho giáo viên với SĐT: {}", savedUser.getPhoneNumber());

        Teacher newTeacher = Teacher.builder()
                .user(savedUser)
                .fullName(request.getFullName())
                .specialty(request.getSpecialty())
                .status(TeacherStatus.ACTIVE)
                .build();
        Teacher savedTeacher = teacherRepository.save(newTeacher);

        log.info("Tạo thành công Profile Giáo viên: {}", savedTeacher.getFullName());

        return TeacherResponse.builder()
                .id(savedTeacher.getId())
                .fullName(savedTeacher.getFullName())
                .phoneNumber(savedUser.getPhoneNumber())
                .specialty(savedTeacher.getSpecialty())
                .status(savedTeacher.getStatus())
                .build();
    }

    @Override
    public PageResponse<TeacherResponse> getTeachers(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());

        Page<Teacher> teacherPage = teacherRepository.searchTeachers(keyword, pageable);

        List<TeacherResponse> responses = teacherPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<TeacherResponse>builder()
                .items(responses)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(teacherPage.getTotalElements())
                .totalPages(teacherPage.getTotalPages())
                .isLast(teacherPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeacherResponse updateTeacher(UUID id, TeacherUpdateRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        teacher.setFullName(request.getFullName());
        teacher.setSpecialty(request.getSpecialty());
        teacher.setStatus(request.getStatus());

        Teacher updatedTeacher = teacherRepository.save(teacher);

        log.info("Cập nhật thành công giáo viên: {}", updatedTeacher.getFullName());
        return mapToResponse(updatedTeacher);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTeacher(UUID id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Teacher.NOT_FOUND));

        teacherRepository.delete(teacher);

        userRepository.delete(teacher.getUser());

        log.info("Đã xóa mềm (Soft-delete) giáo viên và vô hiệu hóa user: {}", teacher.getFullName());
    }

     //helper
    private TeacherResponse mapToResponse(Teacher teacher) {
        return TeacherResponse.builder()
                .id(teacher.getId())
                .fullName(teacher.getFullName())
                .phoneNumber(teacher.getUser().getPhoneNumber())
                .specialty(teacher.getSpecialty())
                .status(teacher.getStatus())
                .build();
    }
}