package com.dunx.swpoolm.iam.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private String rememberMeKey;
    private int sessionTimeoutMinutes;
    private int rememberMeCookieMaxAgeDays;

    private List<String> allowedOrigins;

    private String csrfHeaderName;
    private String csrfCookieName;

    public int getRememberMeMaxAgeSeconds() {
        return rememberMeCookieMaxAgeDays * 24 * 60 * 60;
    }
}