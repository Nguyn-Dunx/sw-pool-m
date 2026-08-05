package com.dunx.swpoolm.student.dto;

import com.dunx.swpoolm.student.enums.SourceType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentCreateRequest {

    @NotBlank(message = "{validation.required}")
    @Size(max = 100, message = "{validation.length}")
    private String fullName;

    @NotNull(message = "{validation.required}")
    @Past(message = "{validation.past}")
    private LocalDate dob;

    @NotBlank(message = "{validation.required}")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "{validation.phone}")
    private String phoneNumber;

    @NotNull(message = "{validation.required}")
    private SourceType sourceType;
}