package com.dunx.swpoolm.iam.security.filter;

import lombok.Getter;
import org.springframework.security.core.AuthenticationException;

import java.util.List;
import java.util.Map;

/**
 * Exception tùy chỉnh mang theo danh sách lỗi validation.
 * Được ném bởi JsonAuthenticationFilter khi dữ liệu đầu vào không hợp lệ.
 */
@Getter
public class ValidationAuthenticationException extends AuthenticationException {

    private final List<Map<String, String>> validationErrors;

    public ValidationAuthenticationException(String msg, List<Map<String, String>> validationErrors) {
        super(msg);
        this.validationErrors = validationErrors;
    }
}
