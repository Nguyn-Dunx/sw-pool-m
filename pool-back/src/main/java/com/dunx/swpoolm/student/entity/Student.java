package com.dunx.swpoolm.student.entity;

import com.dunx.swpoolm.common.entity.BaseEntity;
import com.dunx.swpoolm.student.enums.SourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Student extends BaseEntity{

    @Column(name = "full_name", length = 100, nullable = false)
    private String fullName;

    @Column(name = "dob")
    private LocalDate dob;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 20)
    @Builder.Default
    private SourceType sourceType = SourceType.POOL; // POOL hoặc TEACHER
}
