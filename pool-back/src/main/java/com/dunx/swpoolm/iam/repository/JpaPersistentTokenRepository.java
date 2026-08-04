package com.dunx.swpoolm.iam.repository;

import com.dunx.swpoolm.iam.entity.PersistentLogin;
import com.dunx.swpoolm.iam.repository.PersistentLoginRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.web.authentication.rememberme.PersistentRememberMeToken;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
public class JpaPersistentTokenRepository implements PersistentTokenRepository {

    private final PersistentLoginRepository repository;

    @Override
    public void createNewToken(PersistentRememberMeToken token) {
        PersistentLogin login = PersistentLogin.builder()
                .series(token.getSeries())
                .username(token.getUsername())
                .token(token.getTokenValue())
                .lastUsed(token.getDate())
                .build();
        repository.save(login);
    }

    @Override
    public void updateToken(String series, String tokenValue, Date lastUsed) {
        repository.findById(series).ifPresent(login -> {
            login.setToken(tokenValue);
            login.setLastUsed(lastUsed);
            repository.save(login);
        });
    }

    @Override
    public PersistentRememberMeToken getTokenForSeries(String seriesId) {
        return repository.findById(seriesId)
                .map(login -> new PersistentRememberMeToken(
                        login.getUsername(),
                        login.getSeries(),
                        login.getToken(),
                        login.getLastUsed()))
                .orElse(null);
    }

    @Override
    public void removeUserTokens(String username) {
        repository.deleteByUsername(username);
    }
}