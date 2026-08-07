package com.dunx.swpoolm.operation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class AttendanceHistoryResponse {
    private UUID attendanceId;
    private LocalDate attendDate;
    private String shiftTime;
    private String checkedInBy;
    private String note;
}