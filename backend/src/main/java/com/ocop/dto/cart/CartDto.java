package com.ocop.dto.cart;

import com.ocop.entity.Cart;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class CartDto {
    private Long id;
    private Long userId;
    private List<CartItemDto> items = new ArrayList<>();
    private Integer totalItems = 0;
    private BigDecimal totalAmount = BigDecimal.ZERO;

    public CartDto() {}

    public static CartDto fromEntity(Cart cart) {
        CartDto dto = new CartDto();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUser().getId());
        if (cart.getItems() != null) {
            dto.setItems(cart.getItems().stream().map(CartItemDto::fromEntity).collect(Collectors.toList()));
            dto.setTotalItems(cart.getItems().stream().mapToInt(item -> item.getQuantity()).sum());
            dto.setTotalAmount(cart.getItems().stream()
                    .map(item -> item.getTotalPrice())
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<CartItemDto> getItems() {
        return items;
    }

    public void setItems(List<CartItemDto> items) {
        this.items = items;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
}
