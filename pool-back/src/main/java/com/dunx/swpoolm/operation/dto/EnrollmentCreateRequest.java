package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class EnrollmentCreateRequest {

    @NotNull(message = "{validation.required}")
    private UUID studentId;

    @NotEmpty(message = "{validation.required}")
    private Set<UUID> teacherIds;

    @NotNull(message = "{validation.required}")
    private SwimStyle swimStyle;

    @NotNull(message = "{validation.required}")
    private Boolean isGuaranteed;
}