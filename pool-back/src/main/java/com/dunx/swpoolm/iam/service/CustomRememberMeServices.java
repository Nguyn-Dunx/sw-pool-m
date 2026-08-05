package com.dunx.swpoolm.iam.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

/**
 * Class này ép Spring Security phải đọc biến "rememberMe" từ JSON (được set thông qua request attribute)
 * thay vì cố gắng tìm kiếm trong Form URL-encoded mặc định.
 */
public class CustomRememberMeServices extends PersistentTokenBasedRememberMeServices {

    private final PersistentTokenRepository tokenRepository;

    public CustomRememberMeServices(String key, UserDetailsService userDetailsService, PersistentTokenRepository tokenRepository) {
        super(key, userDetailsService, tokenRepository);
        this.tokenRepository = tokenRepository;
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

    @Override
    public void loginSuccess(HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.Authentication successfulAuthentication) {
        if (!rememberMeRequested(request, "")) {    // xoa tat ca remember token cua user (all tbi)
            tokenRepository.removeUserTokens(
                    successfulAuthentication.getName()
            );
            // Nếu người dùng chọn KHÔNG remember me, ta phải XÓA cookie cũ (nếu có) trên trình duyệt
            cancelCookie(request, response);
            return;
        }
        super.loginSuccess(request, response, successfulAuthentication);
    }
}