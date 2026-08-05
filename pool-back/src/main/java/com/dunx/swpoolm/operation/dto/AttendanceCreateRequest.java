package com.dunx.swpoolm.operation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class AttendanceCreateRequest {

    @NotNull(message = "{validation.required}")
    private UUID enrollmentId;

    @NotNull(message = "{validation.required}")
    private Integer shiftId;

    @NotNull(message = "{validation.required}")
    @PastOrPresent(message = "{error.attendance.future_date}")
    private LocalDate attendDate;

    private String note;
}