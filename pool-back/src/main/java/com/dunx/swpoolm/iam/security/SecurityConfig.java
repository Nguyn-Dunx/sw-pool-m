package com.dunx.swpoolm.iam.security;

import com.dunx.swpoolm.common.constant.SecurityConstants;
import com.dunx.swpoolm.iam.security.filter.JsonAuthenticationFilter;
import com.dunx.swpoolm.iam.security.handler.*;
import com.dunx.swpoolm.iam.security.ratelimit.LoginRateLimitFilter;
import com.dunx.swpoolm.iam.service.CustomRememberMeServices;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.ConcurrentSessionControlAuthenticationStrategy;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final SecurityProperties securityProperties;
    private final PersistentTokenRepository persistentTokenRepository;
    private final Validator validator;
    private final JsonMapper jsonMapper;


    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final CustomAuthenticationSuccessHandler successHandler;
    private final CustomAuthenticationFailureHandler failureHandler;
    private final CustomLogoutSuccessHandler logoutSuccessHandler;
    private final LoginRateLimitFilter loginRateLimitFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationManager authenticationManager, RememberMeServices rememberMeServices) throws Exception {

        // 1. Cấu hình CORS (Đọc từ YML)
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // 2. Cấu hình CSRF cho ReactJS
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieName(securityProperties.getCsrfCookieName());
        csrfTokenRepository.setHeaderName(securityProperties.getCsrfHeaderName());
        csrfTokenRepository.setCookieCustomizer(cookie -> {
            String sameSite = System.getenv("COOKIE_SAME_SITE");
            if ("none".equalsIgnoreCase(sameSite)) {
                cookie.sameSite("None").secure(true);
            }
        });

        http.csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(SecurityConstants.PUBLIC_URLS)
        );

        // 3. Cấu hình Security Headers (Chống Clickjacking, XSS ngầm)
        http.headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .xssProtection(xss -> xss.disable())
                // CSP mở rộng cho SPA: cho phép inline script (React), CDN font/style, ảnh data-uri
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline'; " +
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                        "font-src 'self' https://fonts.gstatic.com data:; " +
                        "img-src 'self' data: blob:; " +
                        "connect-src 'self' https: http: ws:; "
                ))
        );

        // 4. Exception Handling (Trả JSON thay vì HTML)
        http.exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
        );

        // 5. Session Management (Cấm đăng nhập đồng thời 2 thiết bị)
        http.sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(3)
                .sessionRegistry(sessionRegistry())
                .maxSessionsPreventsLogin(false) // Đăng nhập mới sẽ đá đăng nhập cũ ra
        );

        // 6. Phân quyền Endpoint
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers(SecurityConstants.PUBLIC_URLS).permitAll()
                .anyRequest().authenticated()
        );

        // 7. Cấu hình Logout
        http.logout(logout -> logout
                .logoutUrl("/api/v1/auth/logout")
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies(
                        SecurityConstants.JSESSIONID_COOKIE_NAME,
                        SecurityConstants.REMEMBER_ME_COOKIE_NAME,
                        securityProperties.getCsrfCookieName()
                )
                .logoutSuccessHandler(logoutSuccessHandler)
        );

        // 8. Cấu hình Remember Me (Lưu Database thay vì Cookie trần)
        http.rememberMe(remember -> remember
                .rememberMeServices(rememberMeServices)
        );

        // 9. Thêm bộ đọc JSON thay thế cho Form mặc định của Spring
        JsonAuthenticationFilter jsonAuthFilter = new JsonAuthenticationFilter(authenticationManager, jsonMapper, validator);
        jsonAuthFilter.setAuthenticationSuccessHandler(successHandler);
        jsonAuthFilter.setAuthenticationFailureHandler(failureHandler);
        jsonAuthFilter.setRememberMeServices(rememberMeServices); // Tích hợp Remember Me vào Filter JSON

        // Báo cho Filter biết nơi lưu Session
        jsonAuthFilter.setSecurityContextRepository(securityContextRepository());

        // Gắn chiến lược quản lý Session vào Filter (chống Session Fixation + giới hạn phiên)
        jsonAuthFilter.setSessionAuthenticationStrategy(sessionAuthenticationStrategy());

        // Rate limiting cho login — chạy TRƯỚC JsonAuthenticationFilter
        http.addFilterBefore(loginRateLimitFilter, UsernamePasswordAuthenticationFilter.class);

        // Đặt Filter của chúng ta lên trước Filter mặc định
        http.addFilterAt(jsonAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // --- CÁC BEAN HỖ TRỢ ---

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    // Bắt buộc phải có Bean này để Spring biết khi nào 1 Session bị destroy (khi người dùng đóng trình duyệt đột ngột)
    @Bean
    public HttpSessionEventPublisher httpSessionEventPublisher() {
        return new HttpSessionEventPublisher();
    }

    /**
     * Chiến lược quản lý Session cho custom login filter.
     * Gồm 3 bước theo đúng thứ tự chuẩn của Spring Security:
     * 1. Kiểm tra số lượng session đồng thời (max = 3)
     * 2. Chống Session Fixation (đổi Session ID sau đăng nhập)
     * 3. Đăng ký Session mới vào SessionRegistry
     */
    @Bean
    public CompositeSessionAuthenticationStrategy sessionAuthenticationStrategy() {
        ConcurrentSessionControlAuthenticationStrategy concurrentStrategy =
                new ConcurrentSessionControlAuthenticationStrategy(sessionRegistry());
        concurrentStrategy.setMaximumSessions(3);
        concurrentStrategy.setExceptionIfMaximumExceeded(false); // Đăng nhập mới sẽ đá phiên cũ nhất ra

        ChangeSessionIdAuthenticationStrategy sessionFixationStrategy =
                new ChangeSessionIdAuthenticationStrategy();

        RegisterSessionAuthenticationStrategy registerStrategy =
                new RegisterSessionAuthenticationStrategy(sessionRegistry());

        return new CompositeSessionAuthenticationStrategy(List.of(
                concurrentStrategy,
                sessionFixationStrategy,
                registerStrategy
        ));
    }


    @Bean
    public RememberMeServices rememberMeServices() {
        CustomRememberMeServices services = new CustomRememberMeServices(
                securityProperties.getRememberMeKey(),
                userDetailsService,
                persistentTokenRepository // Trực tiếp truyền biến đã inject ở trên vào đây
        );
        services.setCookieName(SecurityConstants.REMEMBER_ME_COOKIE_NAME);
        services.setTokenValiditySeconds(securityProperties.getRememberMeMaxAgeSeconds());
        return services;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(securityProperties.getAllowedOrigins());
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}