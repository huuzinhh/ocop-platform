package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.cert.CertificateAuditRequest;
import com.ocop.dto.cert.CertificateDetailDto;
import com.ocop.dto.cert.CertificateStatsDto;
import com.ocop.service.OcopCertificateService;
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
@RequestMapping("/api/v1/admin/certificates")
@PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin OCOP Certificate Audit", description = "Thẩm định, phê duyệt và quản lý hồ sơ chứng nhận OCOP của các cơ sở sản xuất")
public class AdminCertificateController {

    @Autowired
    private OcopCertificateService certificateService;

    @GetMapping
    @Operation(summary = "Lấy danh sách hồ sơ chứng nhận OCOP (có lọc theo trạng thái: PENDING, APPROVED, REJECTED, EXPIRED, ALL)")
    public ResponseEntity<ApiResponse<List<CertificateDetailDto>>> getCertificates(
            @RequestParam(required = false) String status) {
        List<CertificateDetailDto> list = certificateService.getCertificates(status);
        return ResponseEntity.ok(ApiResponse.ok(list, "Lấy danh sách hồ sơ chứng nhận OCOP thành công"));
    }

    @GetMapping("/stats")
    @Operation(summary = "Thống kê tổng số lượng hồ sơ chứng nhận OCOP theo từng trạng thái thẩm định")
    public ResponseEntity<ApiResponse<CertificateStatsDto>> getCertificateStats() {
        CertificateStatsDto stats = certificateService.getCertificateStats();
        return ResponseEntity.ok(ApiResponse.ok(stats, "Lấy thống kê hồ sơ OCOP thành công"));
    }

    @PutMapping("/{id}/audit")
    @Operation(summary = "Thẩm định hồ sơ chứng nhận OCOP: Phê duyệt (APPROVE) hoặc Từ chối (REJECT kèm lý do)")
    public ResponseEntity<ApiResponse<CertificateDetailDto>> auditCertificate(
            @PathVariable Long id,
            @Valid @RequestBody CertificateAuditRequest request,
            Authentication authentication) {
        String adminUsername = authentication != null ? authentication.getName() : "admin";
        CertificateDetailDto result = certificateService.auditCertificate(id, adminUsername, request);
        String msg = "APPROVE".equalsIgnoreCase(request.getAction())
                ? "Đã phê duyệt chứng nhận OCOP thành công! Sản phẩm được cấp tích xanh bảo chứng."
                : "Đã từ chối hồ sơ chứng nhận OCOP.";
        return ResponseEntity.ok(ApiResponse.ok(result, msg));
    }
}
