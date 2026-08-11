package com.dunx.swpoolm.student.service;

import com.dunx.swpoolm.common.dto.PageRequestValidator;
import com.dunx.swpoolm.common.dto.PageResponse;
import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.student.dto.StudentCreateRequest;
import com.dunx.swpoolm.student.dto.StudentResponse;
import com.dunx.swpoolm.student.dto.StudentUpdateRequest;
import com.dunx.swpoolm.student.dto.TeacherStudentCreateRequest;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.student.enums.SourceType;
import com.dunx.swpoolm.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;

    @Override
    @Transactional
    public StudentResponse createStudent(StudentCreateRequest request) {
        Student student = Student.builder()
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .sourceType(request.getSourceType())
                .dob(request.getDob())
                .build();

        Student savedStudent = studentRepository.save(student);
        log.info("Đã tạo mới học viên: {}", savedStudent.getFullName());

        return mapToResponse(savedStudent);
    }

    @Override
    @Transactional
    public StudentResponse createStudentByTeacher(TeacherStudentCreateRequest request) {
        Student student = Student.builder()
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .dob(request.getDob())
                .sourceType(SourceType.TEACHER) // Tự động set = TEACHER
                .build();

        Student savedStudent = studentRepository.save(student);
        log.info("Giáo viên đã tạo mới học viên: {}", savedStudent.getFullName());

        return mapToResponse(savedStudent);
    }

    @Override
    public PageResponse<StudentResponse> getStudents(String keyword, int page, int size) {
        Pageable pageable = PageRequestValidator.validate(page, size, Sort.by("createdAt").descending());
        Page<Student> studentPage = studentRepository.searchStudents(keyword, pageable);

        List<StudentResponse> responses = studentPage.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return PageResponse.<StudentResponse>builder()
                .items(responses)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(studentPage.getTotalElements())
                .totalPages(studentPage.getTotalPages())
                .isLast(studentPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public StudentResponse updateStudent(UUID id, StudentUpdateRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

        student.setFullName(request.getFullName());
        student.setPhoneNumber(request.getPhoneNumber());
        student.setSourceType(request.getSourceType());
        student.setDob(request.getDob());

        Student updatedStudent = studentRepository.save(student);
        log.info("Cập nhật học viên thành công: {}", updatedStudent.getFullName());

        return mapToResponse(updatedStudent);
    }

    @Override
    @Transactional
    public void deleteStudent(UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Student.NOT_FOUND));

        // Thực thi Soft Delete (Dựa vào @SQLDelete trên Entity)
        studentRepository.delete(student);
        log.info("Đã xóa mềm học viên: {}", student.getFullName());
    }

    private StudentResponse mapToResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .fullName(student.getFullName())
                .phoneNumber(student.getPhoneNumber())
                .sourceType(student.getSourceType())
                .dob(student.getDob())
                .build();
    }
}