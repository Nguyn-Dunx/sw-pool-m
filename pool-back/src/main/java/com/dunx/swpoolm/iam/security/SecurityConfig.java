package com.dunx.swpoolm.iam.security;

import com.dunx.swpoolm.common.constant.SecurityConstants;
import com.dunx.swpoolm.iam.security.filter.JsonAuthenticationFilter;
import com.dunx.swpoolm.iam.security.handler.*;
import com.dunx.swpoolm.iam.service.CustomRememberMeServices;
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
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.sql.DataSource;
import java.util.List;

/**
 * Cấu hình Security chuẩn OWASP cho mô hình Spring Boot + ReactJS (Session-based).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Hỗ trợ @PreAuthorize, @PostAuthorize tại Service Layer
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final SecurityProperties securityProperties;
    private final DataSource dataSource; // Inject DB để lưu Persistent Token


    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final CustomAuthenticationSuccessHandler successHandler;
    private final CustomAuthenticationFailureHandler failureHandler;
    private final CustomLogoutSuccessHandler logoutSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, AuthenticationManager authenticationManager, RememberMeServices rememberMeServices) throws Exception {

        // 1. Cấu hình CORS (Đọc từ YML)
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        // 2. Cấu hình CSRF cho ReactJS
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);
        http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(SecurityConstants.PUBLIC_URLS)
        );

        // 3. Cấu hình Security Headers (Chống Clickjacking, XSS ngầm)
        http.headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .xssProtection(xss -> xss.disable())
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
        );

        // 4. Exception Handling (Trả JSON thay vì HTML)
        http.exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
        );

        // 5. Session Management (Cấm đăng nhập đồng thời 2 thiết bị)
        http.sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().changeSessionId()
                .maximumSessions(1)
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
        JsonAuthenticationFilter jsonAuthFilter = new JsonAuthenticationFilter(authenticationManager);
        jsonAuthFilter.setAuthenticationSuccessHandler(successHandler);
        jsonAuthFilter.setAuthenticationFailureHandler(failureHandler);
        jsonAuthFilter.setRememberMeServices(rememberMeServices); // Tích hợp Remember Me vào Filter JSON

        // Báo cho Filter biết nơi lưu Session
        jsonAuthFilter.setSecurityContextRepository(securityContextRepository());
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

    // Cấu hình Persistent Token cho Remember Me
    // TODO(Spring 7+): Replace JdbcTokenRepositoryImpl because it is deprecated.
    @Bean
    public PersistentTokenRepository persistentTokenRepository() {
        JdbcTokenRepositoryImpl tokenRepository = new JdbcTokenRepositoryImpl();
        tokenRepository.setDataSource(dataSource);
        return tokenRepository;
    }

    // Cấu hình RememberMeServices để liên kết với Filter
    @Bean
    public RememberMeServices rememberMeServices() {
        CustomRememberMeServices services = new CustomRememberMeServices(
                securityProperties.getRememberMeKey(),
                userDetailsService,
                persistentTokenRepository()
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