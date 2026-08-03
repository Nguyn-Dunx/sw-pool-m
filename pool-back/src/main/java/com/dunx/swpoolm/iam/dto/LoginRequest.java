package com.dunx.swpoolm.iam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "{validation.required}")
    private String phoneNumber;

    @NotBlank(message = "{validation.required}")
    private String password;

    private boolean rememberMe;
}