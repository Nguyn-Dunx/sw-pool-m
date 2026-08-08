package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.RequestType;
import com.dunx.swpoolm.operation.enums.SwimStyle;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class EnrollmentRequestCreateDTO {

    private RequestType requestType = RequestType.CREATE; // Mặc định là CREATE

    // Dành cho UPDATE request
    private UUID targetEnrollmentId;

    // Optional (cho cả CREATE và UPDATE, Teacher đề xuất)
    private Integer totalQuota;
    private LocalDate startDate;
    private LocalDate expireDate;

    // Dành cho CREATE request (Bắt buộc)
    private UUID studentId;
    private SwimStyle swimStyle;

    @NotNull(message = "{validation.required}")
    private Boolean isGuaranteed;

    private String note;
}
