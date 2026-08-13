package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalTime;

@Data
@Builder
public class ShiftResponse {
    private Integer id;
    private LocalTime startTime;
    private LocalTime endTime;
    private String period; // MORNING, AFTERNOON, EVENING
    private String label;  // "Sáng 06:00-08:00"
}
