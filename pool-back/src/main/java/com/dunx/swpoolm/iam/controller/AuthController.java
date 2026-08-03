package com.dunx.swpoolm.iam.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.iam.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService; // Inject AuthService

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getMe(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        AuthResponse authData = authService.buildAuthResponse(userDetails);

        return ResponseEntity.ok(ApiResponse.success(authData, "Success"));
    }
}