package com.dunx.swpoolm.common.setting.service;

import com.dunx.swpoolm.common.setting.dto.SettingResponse;
import com.dunx.swpoolm.common.setting.dto.SettingUpdateRequest;

import java.util.List;

public interface SettingService {

    String getString(String key);

    int getInt(String key);

    List<SettingResponse> getAllSettings();

    SettingResponse updateSetting(String key, SettingUpdateRequest request);
}
