package com.dunx.swpoolm.common.setting.service;

import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.common.setting.dto.SettingResponse;
import com.dunx.swpoolm.common.setting.dto.SettingUpdateRequest;
import com.dunx.swpoolm.common.setting.entity.SystemSetting;
import com.dunx.swpoolm.common.setting.repository.SystemSettingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingServiceImpl implements SettingService {

    private final SystemSettingRepository settingRepository;

    // In-memory cache — tránh query DB mỗi lần gọi
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadCache() {
        settingRepository.findAll().forEach(s -> cache.put(s.getSettingKey(), s.getSettingValue()));
        log.info("[Settings] Đã load {} cấu hình vào cache", cache.size());
    }

    @Override
    public String getString(String key) {
        String value = cache.get(key);
        if (value == null) {
            // Fallback: thử lấy từ DB nếu cache miss
            SystemSetting setting = settingRepository.findById(key)
                    .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Setting.NOT_FOUND));
            cache.put(key, setting.getSettingValue());
            return setting.getSettingValue();
        }
        return value;
    }

    @Override
    public int getInt(String key) {
        return Integer.parseInt(getString(key));
    }

    @Override
    public List<SettingResponse> getAllSettings() {
        return settingRepository.findAll().stream()
                .sorted(java.util.Comparator.comparing(SystemSetting::getSettingKey))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public SettingResponse updateSetting(String key, SettingUpdateRequest request) {
        SystemSetting setting = settingRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException(MessageKeys.Setting.NOT_FOUND));

        setting.setSettingValue(request.getValue());
        SystemSetting saved = settingRepository.save(setting);

        // Invalidate cache
        cache.put(key, request.getValue());
        log.info("[Settings] Đã cập nhật: {} = {}", key, request.getValue());

        return mapToResponse(saved);
    }

    private SettingResponse mapToResponse(SystemSetting setting) {
        return SettingResponse.builder()
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
