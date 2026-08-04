package com.dunx.swpoolm.teacher.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeacherCreateRequest {

    @NotBlank(message = "{validation.required}")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "{validation.phone}")
    private String phoneNumber;

    @NotBlank(message = "{validation.required}")
    @Size(min = 6, max = 50, message = "{validation.length}")
    private String password;

    @NotBlank(message = "{validation.required}")
    @Size(max = 100, message = "{validation.length}")
    private String fullName;

    @Size(max = 100, message = "{validation.length}")
    private String specialty;
}