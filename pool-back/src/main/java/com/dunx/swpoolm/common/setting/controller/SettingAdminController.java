package com.dunx.swpoolm.common.setting.controller;

import com.dunx.swpoolm.common.dto.ApiResponse;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.i18n.MessageService;
import com.dunx.swpoolm.common.setting.dto.SettingResponse;
import com.dunx.swpoolm.common.setting.dto.SettingUpdateRequest;
import com.dunx.swpoolm.common.setting.service.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
public class SettingAdminController {

    private final SettingService settingService;
    private final MessageService messageService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SettingResponse>>> getAllSettings() {
        List<SettingResponse> settings = settingService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings, messageService.get(MessageKeys.Common.SUCCESS)));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SettingResponse>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SettingUpdateRequest request) {

        SettingResponse response = settingService.updateSetting(key, request);
        return ResponseEntity.ok(ApiResponse.success(response, messageService.get(MessageKeys.Common.UPDATED)));
    }
}
