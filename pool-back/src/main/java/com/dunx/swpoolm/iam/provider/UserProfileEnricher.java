package com.dunx.swpoolm.iam.provider;

import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.entity.User;


public interface UserProfileEnricher {

    boolean supports(String roleName);

    void enrich(AuthResponse response, User user);
}