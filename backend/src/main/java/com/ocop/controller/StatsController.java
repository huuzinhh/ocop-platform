package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.stats.ProducerDashboardDto;
import com.ocop.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stats")
@Tag(name = "Analytics & Dashboard", description = "Các API thống kê doanh thu, hiệu quả bán hàng và quản trị sản phẩm")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy dữ liệu Dashboard thống kê doanh thu, sản lượng bán và hiệu quả bán hàng")
    public ApiResponse<ProducerDashboardDto> getDashboardStats(
            Authentication authentication,
            @RequestParam(required = false) Long producerId) {
        ProducerDashboardDto dto = statsService.getProducerDashboard(authentication.getName(), producerId);
        return ApiResponse.ok(dto, "Lấy dữ liệu thống kê Dashboard thành công");
    }
}
