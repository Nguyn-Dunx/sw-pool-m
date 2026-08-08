package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
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

    private Integer totalQuota;
}
