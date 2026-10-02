package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.entity.Category;
import com.ocop.entity.Product;
import com.ocop.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "OCOP Products & Catalog", description = "Các API truy vấn sản phẩm OCOP và danh mục")
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
}
