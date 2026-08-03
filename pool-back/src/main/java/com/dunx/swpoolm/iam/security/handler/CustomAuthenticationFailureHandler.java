package com.dunx.swpoolm.iam.security.handler;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
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

@Component
@RequiredArgsConstructor
public class CustomAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final JsonMapper jsonMapper;
    private final MessageService messageService;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
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