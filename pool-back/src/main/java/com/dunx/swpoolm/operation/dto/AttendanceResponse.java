package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class AttendanceResponse {
    private UUID id;
    private String studentName;
    private String shiftTime;
    private LocalDate attendDate;
    private Integer currentSessionCount;
    private String note;
}