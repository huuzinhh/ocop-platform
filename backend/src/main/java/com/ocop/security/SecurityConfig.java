package com.ocop.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Công khai: Health check, Swagger UI và tài liệu OpenAPI
                .requestMatchers("/api/health", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Công khai: Toàn bộ API xác thực (Đăng ký, Đăng nhập)
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register").permitAll()
                .requestMatchers("/api/v1/auth/**").permitAll()
                // Công khai: Xem danh mục, danh sách sản phẩm OCOP, bản đồ và truy xuất nguồn gốc QR
                .requestMatchers(HttpMethod.GET, "/api/v1/products", "/api/v1/products/**", "/api/v1/categories", "/api/v1/categories/**", "/api/v1/gis/**", "/api/v1/trace/**").permitAll()
                // Quyền quản lý sản phẩm: Chỉ Nhà sản xuất và Admin
                .requestMatchers(HttpMethod.POST, "/api/v1/products", "/api/v1/products/**").hasAnyAuthority("ROLE_PRODUCER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/products", "/api/v1/products/**").hasAnyAuthority("ROLE_PRODUCER", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/products", "/api/v1/products/**").hasAnyAuthority("ROLE_PRODUCER", "ROLE_ADMIN")
                // Các API còn lại yêu cầu đăng nhập
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
