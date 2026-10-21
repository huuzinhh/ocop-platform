package com.ocop.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "production_batches")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProductionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "batch_code", nullable = false, unique = true, length = 50)
    private String batchCode;

    @Column(name = "manufacture_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate manufactureDate;

    @Column(name = "expiry_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "qr_code_url", length = 255)
    private String qrCodeUrl;

    @Column(name = "raw_data_hash", nullable = false, length = 66)
    private String rawDataHash;

    @Column(name = "blockchain_tx_hash", length = 66)
    private String blockchainTxHash;

    @Column(name = "blockchain_status", length = 20)
    private String blockchainStatus = "COMMITTED";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("eventTimestamp ASC")
    private List<ProductionEvent> events = new ArrayList<>();

    public ProductionBatch() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getBatchCode() {
        return batchCode;
    }

    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }

    public LocalDate getManufactureDate() {
        return manufactureDate;
    }

    public void setManufactureDate(LocalDate manufactureDate) {
        this.manufactureDate = manufactureDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getRawDataHash() {
        return rawDataHash;
    }

    public void setRawDataHash(String rawDataHash) {
        this.rawDataHash = rawDataHash;
    }

    public String getBlockchainTxHash() {
        return blockchainTxHash;
    }

    public void setBlockchainTxHash(String blockchainTxHash) {
        this.blockchainTxHash = blockchainTxHash;
    }

    public String getBlockchainStatus() {
        return blockchainStatus;
    }

    public void setBlockchainStatus(String blockchainStatus) {
        this.blockchainStatus = blockchainStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<ProductionEvent> getEvents() {
        return events;
    }

    public void setEvents(List<ProductionEvent> events) {
        this.events = events;
    }
}
