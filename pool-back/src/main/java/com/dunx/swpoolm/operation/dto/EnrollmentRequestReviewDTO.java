package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.RequestStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
public class EnrollmentRequestReviewDTO {

    @NotNull(message = "{validation.required}")
    private RequestStatus status; // APPROVED hoặc REJECTED

    private String adminNote;

    // Optional override (Admin có thể sửa lại so với đề xuất của Teacher)
    @Min(value = 1, message = "{validation.min}")
    private Integer totalQuota;
    private LocalDate startDate;
    private LocalDate expireDate;

    // Chỉ bắt buộc khi APPROVED — danh sách giáo viên phụ trách (Nếu là yêu cầu UPDATE thì có thể để null để giữ nguyên giáo viên cũ)
    private Set<UUID> teacherIds;
}
