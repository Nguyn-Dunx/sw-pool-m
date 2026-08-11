package com.dunx.swpoolm.iam.security.ratelimit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test cho LoginRateLimitService — không cần Spring context.
 * Verify brute-force protection: 5 lần/phút/IP.
 */
class LoginRateLimitServiceTest {

    private final LoginRateLimitService service = new LoginRateLimitService();

    @Test
    @DisplayName("5 lần đầu → true, lần thứ 6 → false")
    void fiveAttemptsAllowed_sixthBlocked() {
        String ip = "192.168.1.100";

        // 5 lần đầu được phép
        for (int i = 1; i <= 5; i++) {
            assertTrue(service.tryConsume(ip),
                    "Lần thử thứ " + i + " phải được phép");
        }

        // Lần thứ 6 bị chặn
        assertFalse(service.tryConsume(ip),
                "Lần thử thứ 6 phải bị chặn (rate limit)");
    }

    @Test
    @DisplayName("IP khác nhau có bucket riêng — không ảnh hưởng lẫn nhau")
    void differentIps_haveSeparateBuckets() {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        // ip1 dùng hết 5 lần
        for (int i = 0; i < 5; i++) {
            assertTrue(service.tryConsume(ip1));
        }
        assertFalse(service.tryConsume(ip1));

        // ip2 vẫn dùng được (bucket riêng)
        assertTrue(service.tryConsume(ip2),
                "IP khác phải có bucket riêng, vẫn dùng được");
    }

    @Test
    @DisplayName("Cùng IP — lần đầu luôn true")
    void firstAttempt_alwaysAllowed() {
        String ip = "172.16.0.1";
        assertTrue(service.tryConsume(ip));
    }
}
