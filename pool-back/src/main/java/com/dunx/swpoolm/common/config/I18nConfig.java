package com.dunx.swpoolm.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

@Configuration
public class I18nConfig {

    private static final Locale LOCALE_VI = Locale.forLanguageTag("vi");

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(LOCALE_VI); // Mặc định là Tiếng Việt
        resolver.setSupportedLocales(List.of(LOCALE_VI, Locale.ENGLISH));
        return resolver;
    }
}
