package com.dunx.swpoolm.common.exception;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageService messageService;

    // 1. Xử lý lỗi nghiệp vụ chung (Business Logic)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        String message = messageService.get(ex.getMessageKey(), ex.getArgs());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), message));
    }

    // 2. Xử lý lỗi không tìm thấy tài nguyên (404)
    @ExceptionHandler({ResourceNotFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNotFoundException(Exception ex) {
        String message = ex instanceof ResourceNotFoundException
                ? messageService.get(((ResourceNotFoundException) ex).getMessageKey(), ((ResourceNotFoundException) ex).getArgs())
                : messageService.get(MessageKeys.Common.NOT_FOUND);

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND.value(), message));
    }

    // 3. Xử lý lỗi Validation (Ví dụ: Trống số điện thoại, sai định dạng email)
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(BindException ex) {
        List<ApiResponse.ValidationError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::mapFieldError)
                .toList();

        String message = messageService.get(MessageKeys.Common.VALIDATION);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message(message)
                .errors(errors) // Đính kèm danh sách chi tiết các trường bị lỗi
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    // 4. Xử lý lỗi Không đủ quyền (403 Forbidden - Cho Method Security)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        String message = messageService.get(MessageKeys.Common.ACCESS_DENIED);
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN.value(), message));
    }

    // 5. Xử lý lỗi Chưa đăng nhập (401 Unauthorized - Fallback)
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
        String message = messageService.get(MessageKeys.Auth.UNAUTHORIZED);
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED.value(), message));
    }

    // 6. Bắt toàn bộ các lỗi còn lại (500 Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Internal Server Error: ", ex); // Ghi log chi tiết lỗi cho Developer

        String message = messageService.get(MessageKeys.Common.INTERNAL_SERVER);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), message));
    }

    // --- Helper Method dịch lỗi Validation từ Hibernate Validator sang chuỗi i18n ---
    private ApiResponse.ValidationError mapFieldError(FieldError fieldError) {
        String message = fieldError.getDefaultMessage();

        // Nếu dùng Validation annotation như @NotBlank(message = "{validation.required}")
        if (message != null && message.startsWith("{") && message.endsWith("}")) {
            String key = message.substring(1, message.length() - 1);
            message = messageService.get(key, fieldError.getField());
        }

        return ApiResponse.ValidationError.builder()
                .field(fieldError.getField())
                .message(message)
                .build();
    }
}