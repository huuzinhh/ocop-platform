package com.ocop.controller;

import com.ocop.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "System Health", description = "API Kiểm tra trạng thái hoạt động của hệ thống và Database")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    @Operation(summary = "Kiểm tra sức khỏe Backend & kết nối PostgreSQL")
    public ApiResponse<Map<String, Object>> checkHealth() {
        Map<String, Object> healthInfo = new HashMap<>();
        healthInfo.put("status", "UP");
        healthInfo.put("service", "ocop-backend");
        healthInfo.put("javaVersion", System.getProperty("java.version"));

        try {
            Integer dbTest = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (dbTest != null && dbTest == 1) {
                healthInfo.put("database", "CONNECTED");
                healthInfo.put("databaseEngine", "PostgreSQL 17");
            } else {
                healthInfo.put("database", "UNEXPECTED_RESPONSE");
            }
        } catch (Exception e) {
            healthInfo.put("database", "DISCONNECTED: " + e.getMessage());
        }

        return ApiResponse.ok(healthInfo, "Hệ thống OCOP Backend đang hoạt động ổn định");
    }
}
