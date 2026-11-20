package com.ntc.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Standalone config for the password encoder bean.
 *
 * This lives in its own class (not in SecurityConfig) to break a Spring bean
 * cycle:
 *   SecurityConfig → JwtAuthenticationFilter → SessionService → PasswordEncoder
 * If PasswordEncoder were defined inside SecurityConfig, Spring couldn't
 * construct any of them without tripping over itself.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}