package com.ocop.dto.order;

import com.ocop.entity.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class OrderDto {
    private Long id;
    private String orderCode;
    private Long userId;
    private String username;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private String status;
    private String shippingAddress;
    private String recipientName;
    private String recipientPhone;
    private String note;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentTransactionRef;
    private String trackingCode;
    private String carrierName;
    private String shipmentStatus;
    private List<OrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;

    public OrderDto() {}

    public static OrderDto fromEntity(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setOrderCode(order.getOrderCode());
        dto.setUserId(order.getUser().getId());
        dto.setUsername(order.getUser().getUsername());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingFee(order.getShippingFee());
        dto.setStatus(order.getStatus());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setRecipientName(order.getRecipientName());
        dto.setRecipientPhone(order.getRecipientPhone());
        dto.setNote(order.getNote());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getPayment() != null) {
            dto.setPaymentMethod(order.getPayment().getPaymentMethod());
            dto.setPaymentStatus(order.getPayment().getStatus());
            dto.setPaymentTransactionRef(order.getPayment().getTransactionRef());
        }

        if (order.getShipment() != null) {
            dto.setTrackingCode(order.getShipment().getTrackingCode());
            dto.setCarrierName(order.getShipment().getCarrierName());
            dto.setShipmentStatus(order.getShipment().getStatus());
        }

        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream().map(OrderItemDto::fromEntity).collect(Collectors.toList()));
        }

        return dto;
    }

    public static OrderDto fromEntityForProducer(Order order, Long producerId) {
        OrderDto dto = fromEntity(order);
        if (order.getItems() != null) {
            List<com.ocop.entity.OrderItem> producerItems = order.getItems().stream()
                    .filter(item -> item.getProduct() != null &&
                            item.getProduct().getProducer() != null &&
                            producerId.equals(item.getProduct().getProducer().getId()))
                    .collect(Collectors.toList());

            dto.setItems(producerItems.stream().map(OrderItemDto::fromEntity).collect(Collectors.toList()));

            // Tính tổng tiền các mặt hàng thuộc nhà sản xuất này
            BigDecimal producerTotal = producerItems.stream()
                    .map(com.ocop.entity.OrderItem::getTotalPrice)
                    .filter(p -> p != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setTotalAmount(producerTotal);
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentTransactionRef() {
        return paymentTransactionRef;
    }

    public void setPaymentTransactionRef(String paymentTransactionRef) {
        this.paymentTransactionRef = paymentTransactionRef;
    }

    public String getTrackingCode() {
        return trackingCode;
    }

    public void setTrackingCode(String trackingCode) {
        this.trackingCode = trackingCode;
    }

    public String getCarrierName() {
        return carrierName;
    }

    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }

    public String getShipmentStatus() {
        return shipmentStatus;
    }

    public void setShipmentStatus(String shipmentStatus) {
        this.shipmentStatus = shipmentStatus;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
