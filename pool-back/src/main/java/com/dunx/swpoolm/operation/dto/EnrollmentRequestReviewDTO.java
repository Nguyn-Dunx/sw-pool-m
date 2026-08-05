package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.RequestStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class EnrollmentRequestReviewDTO {

    @NotNull(message = "{validation.required}")
    private RequestStatus status; // APPROVED hoặc REJECTED

    private String adminNote;

    // Chỉ bắt buộc khi APPROVED — danh sách giáo viên phụ trách
    private Set<UUID> teacherIds;
}
