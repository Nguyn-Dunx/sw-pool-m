package com.dunx.swpoolm.student.repository;

import com.dunx.swpoolm.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    Iterable<Student> findByPhoneNumberContaining(String phoneNumber);

    @Query("SELECT s FROM Student s WHERE " +
            "LOWER(s.fullName) LIKE LOWER(CONCAT('%', COALESCE(:keyword, ''), '%')) " +
            "OR s.phoneNumber LIKE CONCAT('%', COALESCE(:keyword, ''), '%')")
    Page<Student> searchStudents(@Param("keyword") String keyword, Pageable pageable);
}