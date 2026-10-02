package com.ocop.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true, nullable = false)
    private Order order;

    @Column(name = "tracking_code", unique = true, length = 50)
    private String trackingCode;

    @Column(name = "carrier_name", length = 100)
    private String carrierName = "Giao Hàng Tiết Kiệm (Mô phỏng)";

    @Column(nullable = false, length = 20)
    private String status = "PREPARING"; // PREPARING, IN_TRANSIT, DELIVERED

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Shipment() {}

    public Shipment(Order order, String trackingCode) {
        this.order = order;
        this.trackingCode = trackingCode;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
