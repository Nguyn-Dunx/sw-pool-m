package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
public class EnrollmentUpdateRequest {

    private Set<UUID> teacherIds;

    private Boolean isGuaranteed;

    private SwimStyle swimStyle;

    private LocalDate expireDate;

    @Min(value = 1, message = "{validation.min}")
    private Integer totalQuota;
}
