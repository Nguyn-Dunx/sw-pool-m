package com.dunx.swpoolm.student.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO cho Teacher tạo Student — không có field sourceType.
 * sourceType sẽ tự động được set = TEACHER trong service.
 */
@Data
public class TeacherStudentCreateRequest {

    @NotBlank(message = "{validation.required}")
    @Size(max = 100, message = "{validation.length}")
    private String fullName;

    @NotNull(message = "{validation.required}")
    @Past(message = "{validation.past}")
    private LocalDate dob;

    @NotBlank(message = "{validation.required}")
    @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "{validation.phone}")
    private String phoneNumber;
}
