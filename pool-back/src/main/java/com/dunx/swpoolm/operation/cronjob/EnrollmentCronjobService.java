package com.dunx.swpoolm.operation.cronjob;

import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentCronjobService {

    private final EnrollmentRepository enrollmentRepository;

    /**
     * Auto run vào lúc 00:01:00 (1 phút sau nửa đêm) mỗi ngày
     * Cron expression: Giây - Phút - Giờ - Ngày - Tháng - Thứ
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional(rollbackFor = Exception.class)
    public void autoExpireEnrollmentsJob() {
        log.info("--- [CRONJOB] BẮT ĐẦU QUÉT KHÓA HỌC HẾT HẠN ---");

        LocalDate today = LocalDate.now();
        int updatedCount = enrollmentRepository.autoExpireEnrollments(today);

        log.info("--- [CRONJOB] Đã chuyển {} khóa học sang trạng thái EXPIRED ---", updatedCount);
    }
}