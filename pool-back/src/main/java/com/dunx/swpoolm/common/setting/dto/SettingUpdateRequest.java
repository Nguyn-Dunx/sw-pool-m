package com.dunx.swpoolm.common.setting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SettingUpdateRequest {

    @NotBlank(message = "{validation.required}")
    private String value;
}
