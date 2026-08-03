package com.dunx.swpoolm.common.exception;

public class ResourceNotFoundException extends AppException {
    public ResourceNotFoundException(String messageKey, Object... args) {
        super(messageKey, args);
    }
}