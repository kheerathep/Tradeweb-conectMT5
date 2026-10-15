package com.tradeweb.config;

import com.tradeweb.auth.filter.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.tradeweb.mt5.filter.EaTokenAuthenticationFilter eaTokenAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            com.tradeweb.mt5.filter.EaTokenAuthenticationFilter eaTokenAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.eaTokenAuthenticationFilter = eaTokenAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"errorCode\":\"UNAUTHORIZED\",\"message\":\"Authentication is required to access this resource\",\"status\":401}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/health/**",
                    "/api/v1/auth/register",
                    "/api/v1/auth/login",
                    "/api/v1/auth/google",
                    "/api/v1/auth/logout",
                    "/error"
                ).permitAll()
                .requestMatchers("/api/v1/mt5/sync/**").hasRole("MT5_EA")
                .requestMatchers("/api/v1/mt5/connections/**").authenticated()
                .requestMatchers("/api/v1/trades/**").authenticated()
                .requestMatchers("/api/v1/analytics/**").authenticated()
                .requestMatchers("/api/v1/auth/me").authenticated()
                .requestMatchers("/api/v1/accounts/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(eaTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
