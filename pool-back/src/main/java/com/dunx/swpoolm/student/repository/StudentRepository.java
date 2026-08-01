package com.dunx.swpoolm.student.repository;

import com.dunx.swpoolm.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    Iterable<Student> findByPhoneNumberContaining(String phoneNumber);
}