package com.ocop.controller;

import com.ocop.common.ApiResponse;
import com.ocop.dto.order.CreateOrderRequest;
import com.ocop.dto.order.MockPaymentRequest;
import com.ocop.dto.order.OrderDto;
import com.ocop.service.OrderService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders & E-Commerce", description = "Các API Đặt hàng, Xem lịch sử và Thanh toán mô phỏng")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới từ giỏ hàng hiện tại")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateOrderRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập để đặt hàng"));
        }
        try {
            OrderDto order = orderService.createOrderFromCart(authentication.getName(), request);
            return ResponseEntity.status(201).body(ApiResponse.ok(order, "Đặt hàng thành công! Mã đơn: " + order.getOrderCode()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(ApiResponse.error("Lỗi đặt hàng: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách lịch sử đơn hàng của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getMyOrders(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        List<OrderDto> orders = orderService.getUserOrders(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(orders, "Lấy lịch sử đơn hàng thành công"));
    }

    @GetMapping("/all")
    @Operation(summary = "Lấy danh sách đơn hàng quản lý (Toàn bộ đối với Admin, chỉ đơn của mình đối với Nhà sản xuất)")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PRODUCER')")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getAllOrders(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        List<OrderDto> orders;
        if (isAdmin) {
            orders = orderService.getAllOrders();
        } else {
            orders = orderService.getProducerOrders(authentication.getName());
        }
        return ResponseEntity.ok(ApiResponse.ok(orders, "Lấy danh sách đơn hàng thành công"));
    }

    @GetMapping("/producer")
    @Operation(summary = "Lấy danh sách đơn hàng chứa sản phẩm của Nhà sản xuất đang đăng nhập")
    @PreAuthorize("hasAuthority('ROLE_PRODUCER')")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getProducerOrders(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        List<OrderDto> orders = orderService.getProducerOrders(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(orders, "Lấy danh sách đơn hàng nhà sản xuất thành công"));
    }

    @GetMapping("/{orderCode}")
    @Operation(summary = "Xem chi tiết một đơn hàng theo mã đơn (orderCode)")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderByCode(
            Authentication authentication,
            @PathVariable String orderCode) {
        try {
            String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
            OrderDto order = orderService.getOrderByCode(username, orderCode);
            return ResponseEntity.ok(ApiResponse.ok(order, "Lấy chi tiết đơn hàng thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{orderCode}/mock-pay")
    @Operation(summary = "Thanh toán mô phỏng (VNPay / MoMo / COD)")
    public ResponseEntity<ApiResponse<OrderDto>> mockPay(
            Authentication authentication,
            @PathVariable String orderCode,
            @RequestBody MockPaymentRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Vui lòng đăng nhập"));
        }
        try {
            OrderDto order = orderService.mockPay(authentication.getName(), orderCode, request);
            return ResponseEntity.ok(ApiResponse.ok(order, "Thanh toán mô phỏng thành công! Đơn hàng đã được xác nhận."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lỗi thanh toán: " + e.getMessage()));
        }
    }

    @PutMapping("/{orderCode}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng (CONFIRMED, SHIPPING, DELIVERED, CANCELLED)")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_PRODUCER')")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            Authentication authentication,
            @PathVariable String orderCode,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Thiếu trường status"));
        }
        try {
            String username = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : null;
            OrderDto order = orderService.updateOrderStatus(username, orderCode, newStatus);
            return ResponseEntity.ok(ApiResponse.ok(order, "Cập nhật trạng thái đơn hàng thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}