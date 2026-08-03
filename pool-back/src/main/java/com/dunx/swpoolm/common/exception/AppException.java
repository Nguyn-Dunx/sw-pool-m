package com.dunx.swpoolm.common.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final String messageKey;
    private final Object[] args;

    public AppException(String messageKey, Object... args) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = args;
    }
}