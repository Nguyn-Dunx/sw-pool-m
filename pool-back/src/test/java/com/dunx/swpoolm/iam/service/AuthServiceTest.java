package com.dunx.swpoolm.iam.service;

import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.entity.Role;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.provider.UserProfileEnricher;
import com.dunx.swpoolm.iam.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {



    @Test
    @DisplayName("buildAuthResponse tạo AuthResponse cho Admin")
    void buildAuthResponse_forAdmin_success() {
        Role role = Role.builder().id(1).roleName("ROLE_ADMIN").build();
        User user = User.builder()
                .phoneNumber("0988888888")
                .role(role)
                .build();
        user.setId(UUID.randomUUID());
        CustomUserDetails userDetails = new CustomUserDetails(user);

        AuthService authService = new AuthService(List.of());

        AuthResponse response = authService.buildAuthResponse(userDetails);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(user.getId());
        assertThat(response.getPhoneNumber()).isEqualTo("0988888888");
        assertThat(response.getRole()).isEqualTo("ROLE_ADMIN");
        assertThat(response.getFullName()).isEqualTo("Ban Quản trị");
        assertThat(response.getTeacherId()).isNull();
    }

    @Test
    @DisplayName("buildAuthResponse chạy qua UserProfileEnricher để gắn teacherId và fullName cho Teacher")
    void buildAuthResponse_forTeacher_runsEnricher() {
        UUID teacherId = UUID.randomUUID();
        Role role = Role.builder().id(2).roleName("ROLE_TEACHER").build();
        User user = User.builder()
                .phoneNumber("0977777777")
                .role(role)
                .build();
        user.setId(UUID.randomUUID());
        CustomUserDetails userDetails = new CustomUserDetails(user);

        UserProfileEnricher teacherEnricher = mock(UserProfileEnricher.class);
        when(teacherEnricher.supports("ROLE_TEACHER")).thenReturn(true);
        doAnswer(invocation -> {
            AuthResponse resp = invocation.getArgument(0);
            resp.setTeacherId(teacherId);
            resp.setFullName("Thầy Nguyễn Văn A");
            return null;
        }).when(teacherEnricher).enrich(any(AuthResponse.class), eq(user));

        AuthService authService = new AuthService(List.of(teacherEnricher));

        AuthResponse response = authService.buildAuthResponse(userDetails);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo("ROLE_TEACHER");
        assertThat(response.getTeacherId()).isEqualTo(teacherId);
        assertThat(response.getFullName()).isEqualTo("Thầy Nguyễn Văn A");
        verify(teacherEnricher).enrich(any(), eq(user));
    }

    @Test
    @DisplayName("buildAuthResponse với userDetails null — ném IllegalArgumentException")
    void buildAuthResponse_null_throwsException() {
        AuthService authService = new AuthService(List.of());
        assertThrows(IllegalArgumentException.class, () -> authService.buildAuthResponse(null));
    }
}
