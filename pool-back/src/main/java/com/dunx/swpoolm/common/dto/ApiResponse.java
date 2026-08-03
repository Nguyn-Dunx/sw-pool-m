package com.dunx.swpoolm.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // disable null field
public class ApiResponse<T> {
    private final int status;
    private final String message;
    private final T data;
    private final List<ValidationError> errors;

    @Builder.Default
    private final Instant timestamp = Instant.now();

    // DTO cho lỗi validation từng trường (VD: phone: "Số điện thoại không hợp lệ")
    @Getter
    @Builder
    public static class ValidationError {
        private final String field;
        private final String message;
    }

    // Static helper method cho Success Response
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .status(200)
                .message(message)
                .data(data)
                .build();
    }

    // Static helper method cho Error Response
    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
                .status(status)
                .message(message)
                .build();
    }
}