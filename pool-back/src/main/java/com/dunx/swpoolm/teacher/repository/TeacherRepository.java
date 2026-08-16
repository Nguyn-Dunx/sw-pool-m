package com.dunx.swpoolm.teacher.repository;

import com.dunx.swpoolm.teacher.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    Optional<Teacher> findByUserId(UUID userId);

    long countByStatus(com.dunx.swpoolm.teacher.enums.TeacherStatus status);

    @Query("SELECT t FROM Teacher t JOIN t.user u WHERE " +
            "(:status IS NULL OR t.status = :status) AND (" +
            "LOWER(t.fullName) LIKE LOWER(CONCAT('%', COALESCE(:keyword, ''), '%')) " +
            "OR u.phoneNumber LIKE CONCAT('%', COALESCE(:keyword, ''), '%')) " +
            "ORDER BY t.createdAt DESC")
    Page<Teacher> searchTeachers(
            @Param("keyword") String keyword,
            @Param("status") com.dunx.swpoolm.teacher.enums.TeacherStatus status,
            Pageable pageable);
}