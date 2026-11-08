package com.dunx.swpoolm.operation.dto;

import com.dunx.swpoolm.operation.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentStatusUpdateRequest {

    @NotNull(message = "{validation.required}")
    private PaymentStatus paymentStatus;
}
