package com.dunx.swpoolm.iam.security.filter;

import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.iam.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Filter block tại URL /api/v1/auth/login.
 * Nó đọc JSON Payload từ React, parse to LoginRequest de Spring Security xử lý.
 */
public class JsonAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    private final JsonMapper jsonMapper;
    private final Validator validator;

    public JsonAuthenticationFilter(AuthenticationManager authenticationManager, JsonMapper jsonMapper, Validator validator) {
        super(authenticationManager);
        this.jsonMapper = jsonMapper;
        this.validator = validator;
        setFilterProcessesUrl("/api/v1/auth/login");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {

        if (request.getContentType() != null && request.getContentType().contains(MediaType.APPLICATION_JSON_VALUE)) {
            try {

                LoginRequest loginRequest = jsonMapper.readValue(request.getInputStream(), LoginRequest.class);

                // Validate dữ liệu đầu vào (kích hoạt @NotBlank, @Size... trong DTO)
                Set<ConstraintViolation<LoginRequest>> violations = validator.validate(loginRequest);
                if (!violations.isEmpty()) {
                    List<Map<String, String>> errors = violations.stream()
                            .map(v -> Map.of(
                                    "field", v.getPropertyPath().toString(),
                                    "message", v.getMessage()
                            ))
                            .toList();
                    throw new ValidationAuthenticationException(MessageKeys.Auth.INVALID_PAYLOAD, errors);
                }

                UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(
                        loginRequest.getPhoneNumber(),
                        loginRequest.getPassword()
                );

                request.setAttribute("remember-me", loginRequest.isRememberMe());

                setDetails(request, authRequest);
                return this.getAuthenticationManager().authenticate(authRequest);
            } catch (IOException e) {
                throw new AuthenticationServiceException(MessageKeys.Auth.INVALID_PAYLOAD, e);
            }
        }

        return super.attemptAuthentication(request, response);
    }
}