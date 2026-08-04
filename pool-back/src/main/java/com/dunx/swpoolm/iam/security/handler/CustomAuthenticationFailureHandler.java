package com.dunx.swpoolm.iam.security.handler;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.iam.security.filter.ValidationAuthenticationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final JsonMapper jsonMapper;
    private final MessageService messageService;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Xử lý lỗi Validation riêng — trả 400 Bad Request thay vì 401
        if (exception instanceof ValidationAuthenticationException validationEx) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);

            String message = messageService.get(MessageKeys.Auth.INVALID_PAYLOAD);

            List<ApiResponse.ValidationError> errors = validationEx.getValidationErrors().stream()
                    .map(e -> ApiResponse.ValidationError.builder()
                            .field(e.get("field"))
                            .message(e.get("message"))
                            .build())
                    .toList();

            ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                    .status(HttpServletResponse.SC_BAD_REQUEST)
                    .message(message)
                    .errors(errors)
                    .build();

            jsonMapper.writeValue(response.getOutputStream(), apiResponse);
            return;
        }

        // Các lỗi Authentication khác — trả 401 Unauthorized
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String messageKey;
        if (exception instanceof LockedException) {
            messageKey = MessageKeys.Auth.ACCOUNT_LOCKED;
        } else if (exception instanceof DisabledException) {
            messageKey = MessageKeys.Auth.ACCOUNT_DISABLED;
        } else if (exception instanceof AuthenticationServiceException){
            messageKey = exception.getMessage();
        }
        else {
            messageKey = MessageKeys.Auth.INVALID_CREDENTIALS;
        }

        String message = messageService.get(messageKey);
        ApiResponse<Void> apiResponse = ApiResponse.error(HttpServletResponse.SC_UNAUTHORIZED, message);

        jsonMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}