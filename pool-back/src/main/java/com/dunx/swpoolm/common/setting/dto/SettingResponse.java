package com.dunx.swpoolm.common.setting.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SettingResponse {
    private String settingKey;
    private String settingValue;
    private String description;
    private Instant updatedAt;
}
