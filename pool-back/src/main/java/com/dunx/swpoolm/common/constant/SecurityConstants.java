package com.dunx.swpoolm.common.constant;

import lombok.experimental.UtilityClass;

@UtilityClass
public class SecurityConstants {

    // Cookie Names
    public static final String JSESSIONID_COOKIE_NAME = "JSESSIONID";
    public static final String REMEMBER_ME_COOKIE_NAME = "REMEMBER_ME";

    // Auth Headers & Prefixes
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    // Security Headers (OWASP)
    public static final String X_FRAME_OPTIONS_HEADER = "X-Frame-Options";
    public static final String X_CONTENT_TYPE_OPTIONS_HEADER = "X-Content-Type-Options";
    public static final String X_XSS_PROTECTION_HEADER = "X-XSS-Protection";
    public static final String CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";

    // Security Route Matchers
    public static final String[] PUBLIC_URLS = {
            "/api/v1/auth/login",
            "/v3/api-docs/**",     // Cho phép Swagger (nếu có dùng)
            "/swagger-ui/**",
            "/swagger-ui.html"
    };
}