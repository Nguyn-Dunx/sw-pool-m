package com.dunx.swpoolm.iam.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

/**
 * Class này ép Spring Security phải đọc biến "rememberMe" từ JSON (được set thông qua request attribute)
 * thay vì cố gắng tìm kiếm trong Form URL-encoded mặc định.
 */
public class CustomRememberMeServices extends PersistentTokenBasedRememberMeServices {

    public CustomRememberMeServices(String key, UserDetailsService userDetailsService, PersistentTokenRepository tokenRepository) {
        super(key, userDetailsService, tokenRepository);
    }

    @Override
    protected boolean rememberMeRequested(HttpServletRequest request, String parameter) {
        // Đọc biến từ JSON đã được JsonAuthenticationFilter set vào Attribute
        Boolean rememberMe = (Boolean) request.getAttribute("remember-me");
        if (rememberMe != null) {
            return rememberMe;
        }
        return false;
    }
}