package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.gis.GisMarkerDto;
import com.ocop.dto.gis.UpdateProducerLocationRequest;
import com.ocop.entity.Producer;
import com.ocop.service.GisService;
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
@RequestMapping("/api/v1/gis")
@Tag(name = "GIS & Interactive Map", description = "Bản đồ số định vị các cơ sở sản xuất, vùng nguyên liệu và khám phá đặc sản OCOP Việt Nam")
public class GisController {

    @Autowired
    private GisService gisService;

    @GetMapping("/markers")
    @Operation(summary = "Lấy danh sách các điểm định vị OCOP trên bản đồ (Hỗ trợ lọc theo tỉnh thành, hạng sao, danh mục, từ khóa)")
    public ResponseEntity<ApiResponse<List<GisMarkerDto>>> getMarkers(
            @RequestParam(required = false) String province,
            @RequestParam(required = false) Short starRating,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        List<GisMarkerDto> list = gisService.getGisMarkers(province, starRating, categoryId, search);
        return ResponseEntity.ok(ApiResponse.ok(list, "Lấy danh sách điểm định vị GIS thành công"));
    }

    @GetMapping("/provinces")
    @Operation(summary = "Lấy danh sách các Tỉnh/Thành phố có cơ sở sản xuất OCOP")
    public ResponseEntity<ApiResponse<List<String>>> getProvinces() {
        List<String> provinces = gisService.getProvinces();
        return ResponseEntity.ok(ApiResponse.ok(provinces, "Lấy danh sách tỉnh thành thành công"));
    }

    @PutMapping("/producers/{producerId}/location")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật tọa độ địa lý GPS (Kinh độ/Vĩ độ) và địa chỉ vùng sản xuất của cơ sở")
    public ResponseEntity<ApiResponse<Producer>> updateProducerLocation(
            @PathVariable Long producerId,
            @Valid @RequestBody UpdateProducerLocationRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        Producer updated = gisService.updateProducerLocation(producerId, request, username);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật tọa độ bản đồ GIS thành công!"));
    }
}
