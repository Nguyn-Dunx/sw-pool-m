package com.dunx.swpoolm.iam.service;

import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.provider.UserProfileEnricher;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    // Spring sẽ tự động scan và thu thập TOÀN BỘ các Class triển khai UserProfileEnricher
    // ở tất cả các module nhét vào List này!
    private final List<UserProfileEnricher> profileEnrichers;

    public AuthResponse buildAuthResponse(CustomUserDetails userDetails) {
        User user = Optional.ofNullable(userDetails)
                .map(CustomUserDetails::getUser)
                .orElseThrow(() -> new IllegalArgumentException("Thông tin UserDetails không hợp lệ"));

        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().getRoleName())
                .build();

        // Chạy qua các Enricher (nếu có) để đính kèm dữ liệu riêng của từng Module
        profileEnrichers.stream()
                .filter(enricher -> enricher.supports(response.getRole()))
                .forEach(enricher -> enricher.enrich(response, user));

        if (response.getFullName() == null && "ROLE_ADMIN".equals(response.getRole())) {
            response.setFullName("Ban Quản trị");
        }

        return response;
    }
}