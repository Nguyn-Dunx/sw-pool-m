package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class EnrollmentUpdateRequest {

    @NotEmpty(message = "{validation.required}")
    private Set<UUID> teacherIds;

    private Boolean isGuaranteed;

    private SwimStyle swimStyle;
}
