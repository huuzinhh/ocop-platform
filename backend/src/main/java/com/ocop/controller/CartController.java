package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.cart.AddToCartRequest;
import com.ocop.dto.cart.CartDto;
import com.ocop.dto.cart.UpdateCartItemRequest;
import com.ocop.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Shopping Cart", description = "Các API Quản lý giỏ hàng người dùng")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    @Operation(summary = "Lấy giỏ hàng của người dùng hiện tại")
    public ResponseEntity<ApiResponse<CartDto>> getCart(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để xem giỏ hàng"));
        }
        CartDto cart = cartService.getCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(cart, "Lấy giỏ hàng thành công"));
    }

    @PostMapping("/items")
    @Operation(summary = "Thêm sản phẩm vào giỏ hàng")
    public ResponseEntity<ApiResponse<CartDto>> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để thêm vào giỏ hàng"));
        }
        try {
            CartDto cart = cartService.addToCart(authentication.getName(), request);
            return ResponseEntity.ok(ApiResponse.ok(cart, "Đã thêm sản phẩm vào giỏ hàng thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi thêm vào giỏ hàng: " + e.getMessage()));
        }
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Cập nhật số lượng món trong giỏ hàng")
    public ResponseEntity<ApiResponse<CartDto>> updateCartItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        try {
            CartDto cart = cartService.updateCartItem(authentication.getName(), itemId, request.getQuantity());
            return ResponseEntity.ok(ApiResponse.ok(cart, "Cập nhật số lượng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Xóa món khỏi giỏ hàng")
    public ResponseEntity<ApiResponse<CartDto>> removeCartItem(
            Authentication authentication,
            @PathVariable Long itemId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        try {
            CartDto cart = cartService.removeCartItem(authentication.getName(), itemId);
            return ResponseEntity.ok(ApiResponse.ok(cart, "Đã xóa món khỏi giỏ hàng"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping
    @Operation(summary = "Xóa toàn bộ giỏ hàng")
    public ResponseEntity<ApiResponse<CartDto>> clearCart(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        CartDto cart = cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(cart, "Đã làm rỗng giỏ hàng"));
    }
}
