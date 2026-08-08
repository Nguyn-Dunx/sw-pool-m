package com.dunx.swpoolm.common.setting.repository;

import com.dunx.swpoolm.common.setting.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
