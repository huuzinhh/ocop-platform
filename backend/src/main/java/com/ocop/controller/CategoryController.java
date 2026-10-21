package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.category.CategoryDto;
import com.ocop.dto.category.CreateCategoryRequest;
import com.ocop.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "OCOP Categories", description = "Quản lý 6 nhóm ngành hàng OCOP chuẩn Quốc gia")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả danh mục ngành hàng OCOP kèm số lượng sản phẩm (Công khai)")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories() {
        List<CategoryDto> list = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(list, "Lấy danh mục thành công"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục ngành hàng OCOP theo ID (Công khai)")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable Long id) {
        CategoryDto dto = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(dto, "Lấy chi tiết danh mục thành công"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Tạo mới danh mục ngành hàng OCOP (Chỉ dành cho Admin)")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        CategoryDto created = categoryService.createCategory(request);
        return ResponseEntity.status(201).body(ApiResponse.ok(created, "Tạo danh mục OCOP thành công"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật danh mục ngành hàng OCOP (Chỉ dành cho Admin)")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CreateCategoryRequest request) {
        CategoryDto updated = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Cập nhật danh mục OCOP thành công"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xóa danh mục ngành hàng OCOP (Chỉ dành cho Admin, an toàn không cho xóa nếu có sản phẩm)")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long id) {
        String msg = categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok(msg, msg));
    }
}
