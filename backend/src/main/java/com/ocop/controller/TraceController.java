package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.trace.CreateBatchRequest;
import com.ocop.dto.trace.CreateEventRequest;
import com.ocop.dto.trace.TraceResponseDto;
import com.ocop.entity.ProductionBatch;
import com.ocop.entity.ProductionEvent;
import com.ocop.service.TraceService;
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
@RequestMapping("/api/v1")
@Tag(name = "Traceability & Blockchain", description = "Quản lý lô sản xuất, nhật ký chuỗi cung ứng và mã QR truy xuất nguồn gốc")
public class TraceController {

    @Autowired
    private TraceService traceService;

    @GetMapping("/trace/{batchCode}")
    @Operation(summary = "Truy xuất nguồn gốc chuỗi cung ứng công khai qua mã lô / mã QR (Không yêu cầu đăng nhập)")
    public ResponseEntity<ApiResponse<TraceResponseDto>> getTraceInfo(@PathVariable String batchCode) {
        try {
            TraceResponseDto dto = traceService.getTraceInfo(batchCode);
            return ResponseEntity.ok(ApiResponse.ok(dto, "Truy xuất nguồn gốc thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/batches")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy danh sách lô sản xuất thuộc quyền quản lý của cơ sở hoặc toàn bộ nếu là Admin")
    public ApiResponse<List<ProductionBatch>> getBatches(Authentication authentication) {
        List<ProductionBatch> batches = traceService.getProducerBatches(authentication.getName());
        return ApiResponse.ok(batches, "Lấy danh sách lô sản xuất thành công");
    }

    @PostMapping("/batches")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Tạo lô sản xuất mới, tự động sinh mã băm SHA-256, giao dịch Blockchain và mã QR")
    public ResponseEntity<ApiResponse<ProductionBatch>> createBatch(
            Authentication authentication,
            @Valid @RequestBody CreateBatchRequest request) {
        try {
            ProductionBatch batch = traceService.createBatch(authentication.getName(), request);
            return ResponseEntity.status(201).body(ApiResponse.ok(batch, "Tạo lô sản xuất và mã QR thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tạo lô sản xuất: " + e.getMessage()));
        }
    }

    @GetMapping("/batches/{batchId}/events")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy danh sách nhật ký hoạt động chuỗi cung ứng của một lô sản xuất")
    public ApiResponse<List<ProductionEvent>> getBatchEvents(@PathVariable Long batchId) {
        List<ProductionEvent> events = traceService.getBatchEvents(batchId);
        return ApiResponse.ok(events, "Lấy nhật ký chuỗi cung ứng thành công");
    }

    @PostMapping("/batches/{batchId}/events")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Ghi thêm một mắt xích sự kiện vào chuỗi cung ứng (Thu hái, Chế biến, Kiểm định, Đóng gói, Vận chuyển)")
    public ResponseEntity<ApiResponse<ProductionEvent>> addEvent(
            Authentication authentication,
            @PathVariable Long batchId,
            @Valid @RequestBody CreateEventRequest request) {
        try {
            ProductionEvent event = traceService.addEvent(authentication.getName(), batchId, request);
            return ResponseEntity.status(201).body(ApiResponse.ok(event, "Ghi nhật ký sự kiện chuỗi cung ứng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi ghi sự kiện: " + e.getMessage()));
        }
    }
}
