package com.dunx.swpoolm.iam.security;

import com.dunx.swpoolm.common.i18n.MessageKeys;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(@NonNull String phoneNumber) throws UsernameNotFoundException {
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new UsernameNotFoundException(MessageKeys.User.NOT_FOUND_BY_PHONE));

        return new CustomUserDetails(user);
    }
}
