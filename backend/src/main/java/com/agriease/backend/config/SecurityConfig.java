package com.agriease.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests(auth -> auth
                        // allow preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                            "/auth/login", "/auth/register",
                            "/api/auth/login", "/api/auth/register",
                            "/agriease/auth/login", "/agriease/auth/register",
                            "/agriease/api/auth/login", "/agriease/api/auth/register"
                        ).permitAll()
                        .requestMatchers("/error", "/agriease/error").permitAll()
                        .requestMatchers("/public/**", "/agriease/public/**").permitAll()
                        .requestMatchers("/api/user/**", "/agriease/api/user/**", "/user/**", "/agriease/user/**").hasAnyRole("FARMER", "SUPPLIER", "DELIVERY_AGENT")
                        .requestMatchers("/farmer/**", "/agriease/farmer/**", "/api/farmer/**", "/agriease/api/farmer/**").hasRole("FARMER")
                        .requestMatchers("/supplier/**", "/agriease/supplier/**").hasRole("SUPPLIER")
                        .requestMatchers("/api/orders/**", "/agriease/api/orders/**").hasAnyRole("FARMER", "SUPPLIER")
                        .requestMatchers("/api/agent/**", "/agriease/api/agent/**", "/api/delivery/**", "/agriease/api/delivery/**").hasRole("DELIVERY_AGENT")
                        .anyRequest().authenticated()
                    )
            .httpBasic(Customizer.withDefaults());

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow local dev origins (Vite default 5173 and some scripts use 5174/5175)
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:5175"));
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
