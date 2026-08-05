package com.dunx.swpoolm.student.dto;

import com.dunx.swpoolm.student.enums.SourceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class StudentResponse {
    private UUID id;
    private String fullName;
    private LocalDate dob;
    private String phoneNumber;
    private SourceType sourceType;
}