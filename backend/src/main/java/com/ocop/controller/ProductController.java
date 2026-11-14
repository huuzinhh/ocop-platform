package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.product.AiProductDto;
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

    @GetMapping("/products/ai-search")
    @Operation(summary = "Endpoint rút gọn dành riêng cho AI Agent / n8n tra cứu thông tin sản phẩm và câu chuyện OCOP")
    public ApiResponse<List<AiProductDto>> searchForAi(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String starRating) {

        // Tự động làm sạch tham số search (phòng trường hợp n8n gửi thừa dấu =)
        String cleanSearch = search;
        if (cleanSearch != null) {
            cleanSearch = cleanSearch.trim();
            if (cleanSearch.startsWith("=")) {
                cleanSearch = cleanSearch.substring(1).trim();
            }
        }

        // Tự động làm sạch và ép kiểu starRating (ví dụ: "=5", "5 sao", "= 5" -> 5)
        Short parsedStar = null;
        if (starRating != null && !starRating.trim().isEmpty()) {
            String digitsOnly = starRating.replaceAll("[^0-9]", "");
            if (!digitsOnly.isEmpty()) {
                try {
                    parsedStar = Short.parseShort(digitsOnly);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        // Tự động bóc tách số sao nếu người dùng truyền gộp trong tham số search (ví dụ: search="5 sao", "4 sao")
        if (parsedStar == null && cleanSearch != null) {
            String lower = cleanSearch.toLowerCase().trim();
            if (lower.matches("^[1-5](\\s*sao)?$") || lower.matches("^(sao\\s*)?[1-5]$") || lower.contains("5 sao") || lower.contains("4 sao") || lower.contains("3 sao")) {
                String digitsOnly = lower.replaceAll("[^0-9]", "");
                if (!digitsOnly.isEmpty()) {
                    try {
                        parsedStar = Short.parseShort(digitsOnly);
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }

        List<Product> list;
        if (parsedStar != null) {
            list = productService.getProductsByStar(parsedStar);
        } else if (cleanSearch != null && !cleanSearch.isEmpty()) {
            list = productService.search(cleanSearch);
        } else {
            list = productService.getAllProducts();
        }

        // Giới hạn tối đa 4 sản phẩm tiêu biểu nhất để AI đọc cực nhanh và phản hồi tức thì
        List<AiProductDto> dtoList = list.stream()
                .limit(4)
                .map(p -> {
                    String story = p.getCulturalStory();
                    if (story != null && story.length() > 220) {
                        story = story.substring(0, 220) + "...";
                    }
                    return new AiProductDto(
                        p.getId(),
                        p.getName(),
                        p.getPrice(),
                        p.getUnit(),
                        p.getOcopStarRating(),
                        p.getProducer() != null ? p.getProducer().getName() : "N/A",
                        (p.getProducer() != null && p.getProducer().getLocation() != null)
                                ? p.getProducer().getLocation().getProvince() : "N/A",
                        story
                    );
                }).toList();

        return ApiResponse.ok(dtoList, "Tra cứu dữ liệu sản phẩm cho AI thành công");
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
    public ResponseEntity<ApiResponse<String>> deleteProduct(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            String msg = productService.deleteProduct(authentication.getName(), id);
            return ResponseEntity.ok(ApiResponse.ok(msg, msg));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi xóa: " + e.getMessage()));
        }
    }
}
