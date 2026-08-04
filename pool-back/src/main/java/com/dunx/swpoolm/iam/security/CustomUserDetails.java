package com.dunx.swpoolm.iam.security;

import com.dunx.swpoolm.iam.entity.User;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;


@Getter
@AllArgsConstructor
@EqualsAndHashCode(of = "user")
public class CustomUserDetails implements UserDetails {

    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority(user.getRole().getRoleName()));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getPhoneNumber(); // Dùng số điện thoại làm Username
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getIsActive(); // Khóa nếu isActive = false
    }

    @Override
    public boolean isEnabled() {
        return user.getIsActive();
    }
}
