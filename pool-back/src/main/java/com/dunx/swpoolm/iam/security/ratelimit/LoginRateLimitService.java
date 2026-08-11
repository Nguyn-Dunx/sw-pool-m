package com.dunx.swpoolm.iam.security.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting cho endpoint /api/v1/auth/login theo IP address.
 * <p>
 * Giới hạn: 5 lần thử đăng nhập / 1 phút / IP.
 * Khi vượt quá, filter sẽ trả về HTTP 429 Too Many Requests.
 * <p>
 * Dùng in-memory ConcurrentHashMap — đủ cho single-instance deployment.
 * Nếu chạy multi-instance (load balancer), cần chuyển sang distributed bucket (Redis/Hazelcast).
 */
@Slf4j
@Service
public class LoginRateLimitService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public boolean tryConsume(String ipAddress) {
        Bucket bucket = cache.computeIfAbsent(ipAddress, this::createNewBucket);
        boolean allowed = bucket.tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceeded for IP: {}", ipAddress);
        }
        return allowed;
    }

    private Bucket createNewBucket(String ipAddress) {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS,
                Refill.intervally(MAX_ATTEMPTS, REFILL_PERIOD));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Dọn dẹp bucket cũ (gọi định kỳ nếu cần tiết kiệm memory).
     * Hiện tại bucket tự refill nên không bắt buộc.
     */
    public void cleanupStaleBuckets() {
        // TODO: implement eviction nếu memory là vấn đề (bucket không dùng > 1 giờ)
    }
}
