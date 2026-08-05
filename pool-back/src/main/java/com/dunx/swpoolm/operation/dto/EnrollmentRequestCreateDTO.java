package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.SwimStyle;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class EnrollmentRequestCreateDTO {

    @NotNull(message = "{validation.required}")
    private UUID studentId;

    @NotNull(message = "{validation.required}")
    private SwimStyle swimStyle;

    @NotNull(message = "{validation.required}")
    private Boolean isGuaranteed;

    private String note;
}
