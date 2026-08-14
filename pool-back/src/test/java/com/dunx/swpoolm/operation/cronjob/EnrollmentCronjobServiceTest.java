package com.dunx.swpoolm.operation.cronjob;

import com.dunx.swpoolm.operation.repository.EnrollmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnrollmentCronjobServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @InjectMocks
    private EnrollmentCronjobService enrollmentCronjobService;

    @Test
    @DisplayName("Chạy cronjob tự động quét và cập nhật khóa học quá hạn sang EXPIRED")
    void autoExpireEnrollmentsJob_executesRepositoryUpdate() {
        when(enrollmentRepository.autoExpireEnrollments(any(LocalDate.class))).thenReturn(5);

        enrollmentCronjobService.autoExpireEnrollmentsJob();

        verify(enrollmentRepository).autoExpireEnrollments(any(LocalDate.class));
    }
}
