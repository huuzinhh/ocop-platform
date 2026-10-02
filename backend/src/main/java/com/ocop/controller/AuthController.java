package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.auth.*;
import com.ocop.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Đăng ký, Đăng nhập và Quản lý tài khoản người dùng")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng username/email và mật khẩu, nhận JWT Access Token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse authResponse = authService.login(request);
            return ResponseEntity.ok(ApiResponse.ok(authResponse, "Đăng nhập thành công! Chào mừng trở lại."));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Đăng nhập thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới (Khách hàng hoặc Nhà sản xuất)")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            UserDto userDto = authService.register(request);
            return ResponseEntity.status(201)
                    .body(ApiResponse.ok(userDto, "Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    @Operation(
        summary = "Lấy thông tin tài khoản người dùng hiện đang đăng nhập",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Bạn chưa đăng nhập hoặc token không hợp lệ"));
        }
        try {
            UserDto userDto = authService.getCurrentUser(authentication.getName());
            return ResponseEntity.ok(ApiResponse.ok(userDto, "Lấy thông tin tài khoản thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("Không tìm thấy tài khoản: " + e.getMessage()));
        }
    }
}
