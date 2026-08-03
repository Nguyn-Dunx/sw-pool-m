package com.dunx.swpoolm.iam.security.handler;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final JsonMapper jsonMapper;
    private final MessageService messageService;

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_OK);

        String message = messageService.get(MessageKeys.Auth.LOGOUT_SUCCESS);
        ApiResponse<Void> apiResponse = ApiResponse.success(null, message);

        jsonMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}