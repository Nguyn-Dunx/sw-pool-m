package com.dunx.swpoolm.teacher.provider;

import com.dunx.swpoolm.iam.dto.AuthResponse;
import com.dunx.swpoolm.iam.entity.User;
import com.dunx.swpoolm.iam.provider.UserProfileEnricher;
import com.dunx.swpoolm.teacher.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeacherProfileEnricher implements UserProfileEnricher {

    private final TeacherRepository teacherRepository;

    private static final String ROLE_TEACHER = "ROLE_TEACHER";

    @Override
    public boolean supports(String roleName) {
        return ROLE_TEACHER.equals(roleName);
    }

    @Override
    public void enrich(AuthResponse response, User user) {
        teacherRepository.findByUserId(user.getId())
                .ifPresent(teacher -> {
                    response.setTeacherId(teacher.getId());
                    response.setFullName(teacher.getFullName());
                });
    }
}