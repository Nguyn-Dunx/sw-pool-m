package com.dunx.swpoolm.common.setting.service;

import com.dunx.swpoolm.common.exception.ResourceNotFoundException;
import com.dunx.swpoolm.common.setting.dto.SettingResponse;
import com.dunx.swpoolm.common.setting.dto.SettingUpdateRequest;
import com.dunx.swpoolm.common.setting.entity.SystemSetting;
import com.dunx.swpoolm.common.setting.repository.SystemSettingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingServiceTest {

    @Mock
    private SystemSettingRepository settingRepository;

    @InjectMocks
    private SettingServiceImpl settingService;

    @Nested
    @DisplayName("loadCache() and getInt() / getString()")
    class CacheAndGetterTests {

        @Test
        @DisplayName("loadCache đọc tất cả cấu hình từ DB vào cache")
        void loadCache_and_getInt_returnsValue() {
            SystemSetting s1 = SystemSetting.builder().settingKey("enrollment.duration-days").settingValue("45").build();
            SystemSetting s2 = SystemSetting.builder().settingKey("enrollment.default-quota").settingValue("12").build();

            when(settingRepository.findAll()).thenReturn(List.of(s1, s2));

            settingService.loadCache();

            int duration = settingService.getInt("enrollment.duration-days");
            int quota = settingService.getInt("enrollment.default-quota");

            assertThat(duration).isEqualTo(45);
            assertThat(quota).isEqualTo(12);
        }

        @Test
        @DisplayName("Cache miss -> đọc từ DB và lưu lại vào cache")
        void cacheMiss_fetchesFromDatabase() {
            SystemSetting s = SystemSetting.builder().settingKey("new.key").settingValue("100").build();
            when(settingRepository.findById("new.key")).thenReturn(Optional.of(s));

            int val = settingService.getInt("new.key");

            assertThat(val).isEqualTo(100);
            verify(settingRepository).findById("new.key");
        }

        @Test
        @DisplayName("Không tìm thấy cấu hình ở cả cache và DB — ném ResourceNotFoundException")
        void settingNotFound_throwsException() {
            when(settingRepository.findById("unknown.key")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> settingService.getString("unknown.key"));
        }
    }

    @Nested
    @DisplayName("getAllSettings()")
    class GetAllSettingsTests {

        @Test
        @DisplayName("Lấy tất cả cấu hình được sắp xếp theo settingKey tăng dần")
        void getAllSettings_returnsSortedList() {
            SystemSetting s1 = SystemSetting.builder().settingKey("b.key").settingValue("2").build();
            SystemSetting s2 = SystemSetting.builder().settingKey("a.key").settingValue("1").build();

            when(settingRepository.findAll()).thenReturn(List.of(s1, s2));

            List<SettingResponse> result = settingService.getAllSettings();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getSettingKey()).isEqualTo("a.key");
            assertThat(result.get(1).getSettingKey()).isEqualTo("b.key");
        }
    }

    @Nested
    @DisplayName("updateSetting()")
    class UpdateSettingTests {

        @Test
        @DisplayName("Cập nhật cấu hình thành công và làm mới cache")
        void updateSetting_success() {
            String key = "enrollment.duration-days";
            SystemSetting setting = SystemSetting.builder().settingKey(key).settingValue("45").build();

            SettingUpdateRequest request = new SettingUpdateRequest();
            request.setValue("60");

            when(settingRepository.findById(key)).thenReturn(Optional.of(setting));
            when(settingRepository.save(any(SystemSetting.class))).thenAnswer(i -> i.getArgument(0));

            SettingResponse response = settingService.updateSetting(key, request);

            assertThat(response).isNotNull();
            assertThat(response.getSettingValue()).isEqualTo("60");
            assertThat(settingService.getInt(key)).isEqualTo(60);
        }
    }
}
