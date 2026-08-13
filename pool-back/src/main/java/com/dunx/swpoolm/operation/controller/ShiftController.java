package com.dunx.swpoolm.operation.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.operation.dto.ShiftResponse;
import com.dunx.swpoolm.operation.entity.Shift;
import com.dunx.swpoolm.operation.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teacher/shifts")
@RequiredArgsConstructor
public class ShiftController {

    private final ShiftRepository shiftRepository;

    private static final Map<String, String> PERIOD_VN = Map.of(
            "MORNING", "Sáng",
            "AFTERNOON", "Chiều",
            "EVENING", "Tối"
    );

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getShifts() {
        List<ShiftResponse> shifts = shiftRepository.findAll().stream()
                .sorted((a, b) -> a.getStartTime().compareTo(b.getStartTime()))
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(shifts, "Danh sách ca học"));
    }

    private ShiftResponse toResponse(Shift s) {
        String periodVn = PERIOD_VN.getOrDefault(s.getPeriod().name(), s.getPeriod().name());
        return ShiftResponse.builder()
                .id(s.getId())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .period(s.getPeriod().name())
                .label(String.format("%s %s-%s", periodVn, s.getStartTime(), s.getEndTime()))
                .build();
    }
}
