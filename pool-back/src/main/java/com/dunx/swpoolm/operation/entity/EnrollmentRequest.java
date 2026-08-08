package com.dunx.swpoolm.operation.entity;

import com.dunx.swpoolm.common.entity.BaseEntity;
import com.dunx.swpoolm.operation.enums.RequestStatus;
import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import com.dunx.swpoolm.student.entity.Student;
import com.dunx.swpoolm.teacher.entity.Teacher;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "enrollment_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE enrollment_requests SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class EnrollmentRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "swim_style", length = 20, nullable = false)
    private SwimStyle swimStyle;

    @Column(name = "is_guaranteed")
    @Builder.Default
    private Boolean isGuaranteed = false;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", length = 20)
    @Builder.Default
    private RequestType requestType = RequestType.CREATE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_enrollment_id")
    private Enrollment targetEnrollment;

    @Column(name = "total_quota")
    private Integer totalQuota;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expire_date")
    private LocalDate expireDate;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
