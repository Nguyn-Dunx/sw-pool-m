package com.dunx.swpoolm.teacher.dto;

import com.dunx.swpoolm.teacher.enums.TeacherStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeacherUpdateRequest {

    @NotBlank(message = "{validation.required}")
    @Size(max = 100, message = "{validation.length}")
    private String fullName;

    @Size(max = 100, message = "{validation.length}")
    private String specialty;

    @NotNull(message = "{validation.required}")
    private TeacherStatus status;
}