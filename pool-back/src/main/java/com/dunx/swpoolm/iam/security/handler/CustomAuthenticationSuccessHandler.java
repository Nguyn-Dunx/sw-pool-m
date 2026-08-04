package com.dunx.swpoolm.iam.security.handler;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.repository.UserRepository;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import com.dunx.swpoolm.iam.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final JsonMapper jsonMapper;
    private final MessageService messageService;
    private final AuthService authService;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_OK);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // Cập nhật thời gian đăng nhập lần cuối
        User user = userDetails.getUser();
        user.setLastLogin(Instant.now());
        userRepository.save(user);

        AuthResponse authData = authService.buildAuthResponse(userDetails);

        String message = messageService.get(MessageKeys.Auth.LOGIN_SUCCESS);
        ApiResponse<AuthResponse> apiResponse = ApiResponse.success(authData, message);

        jsonMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}