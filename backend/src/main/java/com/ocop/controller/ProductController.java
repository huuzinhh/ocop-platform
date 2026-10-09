package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.product.CreateProductRequest;
import com.ocop.entity.Category;
import com.ocop.entity.Product;
import com.ocop.service.ProductService;
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
@Tag(name = "OCOP Products & Catalog", description = "Các API truy vấn và quản lý sản phẩm OCOP, danh mục")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/products")
    @Operation(summary = "Lấy danh sách sản phẩm OCOP (có hỗ trợ tìm kiếm và lọc theo hạng sao)")
    public ApiResponse<List<Product>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Short starRating) {
        
        List<Product> products;
        if (starRating != null) {
            products = productService.getProductsByStar(starRating);
        } else if (search != null && !search.trim().isEmpty()) {
            products = productService.search(search);
        } else {
            products = productService.getAllProducts();
        }

        return ApiResponse.ok(products, "Lấy danh sách sản phẩm thành công");
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Xem chi tiết một sản phẩm OCOP theo ID")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.ok(p)))
                .orElse(ResponseEntity.status(404).body(ApiResponse.error("Không tìm thấy sản phẩm")));
    }

    @GetMapping("/categories")
    @Operation(summary = "Lấy danh sách toàn bộ danh mục sản phẩm OCOP")
    public ApiResponse<List<Category>> getCategories() {
        return ApiResponse.ok(productService.getAllCategories(), "Lấy danh mục thành công");
    }

    @GetMapping("/products/my-products")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy danh sách sản phẩm thuộc quyền quản lý của người dùng đang đăng nhập")
    public ApiResponse<List<Product>> getMyProducts(Authentication authentication) {
        List<Product> products = productService.getMyProducts(authentication.getName());
        return ApiResponse.ok(products, "Lấy danh sách sản phẩm của cơ sở thành công");
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Đăng bán sản phẩm OCOP mới (Chỉ dành cho Nhà sản xuất hoặc Quản trị viên)")
    public ResponseEntity<ApiResponse<Product>> createProduct(
            Authentication authentication,
            @Valid @RequestBody CreateProductRequest request) {
        try {
            Product product = productService.createProduct(authentication.getName(), request);
            return ResponseEntity.status(201).body(ApiResponse.ok(product, "Đăng bán sản phẩm OCOP thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi tạo sản phẩm: " + e.getMessage()));
        }
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cập nhật thông tin sản phẩm OCOP")
    public ResponseEntity<ApiResponse<Product>> updateProduct(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody CreateProductRequest request) {
        try {
            Product product = productService.updateProduct(authentication.getName(), id, request);
            return ResponseEntity.ok(ApiResponse.ok(product, "Cập nhật sản phẩm thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi cập nhật: " + e.getMessage()));
        }
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_PRODUCER', 'ROLE_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Xóa sản phẩm OCOP khỏi gian hàng")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            productService.deleteProduct(authentication.getName(), id);
            return ResponseEntity.ok(ApiResponse.ok(null, "Đã xóa sản phẩm thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi xóa: " + e.getMessage()));
        }
    }
}
