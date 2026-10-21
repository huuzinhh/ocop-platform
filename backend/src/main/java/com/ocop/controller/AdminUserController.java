package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.user.UpdateUserStatusRequest;
import com.ocop.dto.user.UserDetailDto;
import com.ocop.dto.user.UserStatsDto;
import com.ocop.dto.user.VerifyProducerRequest;
import com.ocop.entity.Producer;
import com.ocop.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin User & Producer Management", description = "Quản lý danh sách người dùng, khóa/mở tài khoản và phê duyệt cơ sở sản xuất OCOP")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng với bộ lọc theo vai trò (ADMIN, PRODUCER, CUSTOMER), trạng thái và từ khóa tìm kiếm")
    public ResponseEntity<ApiResponse<List<UserDetailDto>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<UserDetailDto> list = adminUserService.getUsers(role, status, search);
        return ResponseEntity.ok(ApiResponse.ok(list, "Lấy danh sách người dùng thành công"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Thống kê người dùng theo vai trò và trạng thái hoạt động")
    public ResponseEntity<ApiResponse<UserStatsDto>> getUserStats() {
        UserStatsDto stats = adminUserService.getUserStats();
        return ResponseEntity.ok(ApiResponse.ok(stats, "Lấy thống kê người dùng thành công"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái người dùng (Khóa hoặc Mở khóa tài khoản: ACTIVE hoặc LOCKED)")
    public ResponseEntity<ApiResponse<UserDetailDto>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        UserDetailDto updated = adminUserService.updateUserStatus(id, request.getStatus(), adminUsername);
        String msg = "LOCKED".equalsIgnoreCase(request.getStatus())
                ? "Đã khóa tài khoản người dùng thành công"
                : "Đã mở khóa kích hoạt tài khoản người dùng thành công";
        return ResponseEntity.ok(ApiResponse.ok(updated, msg));
    }

    @PutMapping("/producers/{producerId}/verify")
    @Operation(summary = "Phê duyệt hoặc hủy phê duyệt xác thực pháp lý cho Cơ sở sản xuất / HTX")
    public ResponseEntity<ApiResponse<Producer>> verifyProducer(
            @PathVariable Long producerId,
            @RequestBody(required = false) VerifyProducerRequest request) {
        Boolean isVerified = request != null && request.getIsVerified() != null ? request.getIsVerified() : true;
        Producer updated = adminUserService.verifyProducer(producerId, isVerified);
        String msg = Boolean.TRUE.equals(isVerified)
                ? "Đã phê duyệt xác thực cơ sở sản xuất thành công! Tích xanh HTX đã được cấp."
                : "Đã hủy trạng thái xác thực cơ sở sản xuất.";
        return ResponseEntity.ok(ApiResponse.ok(updated, msg));
    }
}
