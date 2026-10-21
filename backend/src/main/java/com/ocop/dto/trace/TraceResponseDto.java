package com.ocop.dto.trace;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.ocop.entity.OcopCertificate;
import com.ocop.entity.ProductionBatch;
import com.ocop.entity.ProductionEvent;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class TraceResponseDto {

    // 1. Thông tin Lô sản xuất
    private Long batchId;
    private String batchCode;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate manufactureDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;
    private Integer quantity;
    private String qrCodeUrl;
    private String rawDataHash;
    private String blockchainTxHash;
    private String blockchainStatus;

    // 2. Thông tin Sản phẩm OCOP
    private Long productId;
    private String productName;
    private String productSlug;
    private BigDecimal price;
    private String unit;
    private String thumbnail;
    private Short ocopStarRating;
    private String description;
    private String culturalStory;
    private String categoryName;

    // 3. Thông tin Chủ thể / Nhà sản xuất
    private Long producerId;
    private String producerName;
    private String producerCode;
    private String producerProvince;
    private String producerAddress;
    private String producerPhone;
    private String producerEmail;
    private Boolean isProducerVerified;

    // 4. Thông tin Chứng nhận OCOP
    private String certificateCode;
    private Short certificateStarRating;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate certIssuedDate;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate certExpiryDate;
    private String certIssuingAuthority;
    private String certDocumentUrl;

    // 5. Nhật ký các sự kiện chuỗi cung ứng (Blockchain Traceability Events)
    private List<ProductionEvent> events;

    // 6. Tính hợp lệ bảo mật
    private Boolean isIntegrityVerified = true;
    private LocalDateTime verifiedAt = LocalDateTime.now();

    public TraceResponseDto() {}

    public static TraceResponseDto fromEntity(ProductionBatch batch, List<ProductionEvent> events) {
        TraceResponseDto dto = new TraceResponseDto();
        dto.setBatchId(batch.getId());
        dto.setBatchCode(batch.getBatchCode());
        dto.setManufactureDate(batch.getManufactureDate());
        dto.setExpiryDate(batch.getExpiryDate());
        dto.setQuantity(batch.getQuantity());
        dto.setQrCodeUrl(batch.getQrCodeUrl());
        dto.setRawDataHash(batch.getRawDataHash());
        dto.setBlockchainTxHash(batch.getBlockchainTxHash());
        dto.setBlockchainStatus(batch.getBlockchainStatus());

        if (batch.getProduct() != null) {
            dto.setProductId(batch.getProduct().getId());
            dto.setProductName(batch.getProduct().getName());
            dto.setProductSlug(batch.getProduct().getSlug());
            dto.setPrice(batch.getProduct().getPrice());
            dto.setUnit(batch.getProduct().getUnit());
            dto.setThumbnail(batch.getProduct().getThumbnail());
            dto.setOcopStarRating(batch.getProduct().getOcopStarRating());
            dto.setDescription(batch.getProduct().getDescription());
            dto.setCulturalStory(batch.getProduct().getCulturalStory());
            if (batch.getProduct().getCategory() != null) {
                dto.setCategoryName(batch.getProduct().getCategory().getName());
            }

            if (batch.getProduct().getProducer() != null) {
                dto.setProducerId(batch.getProduct().getProducer().getId());
                dto.setProducerName(batch.getProduct().getProducer().getName());
                dto.setProducerCode(batch.getProduct().getProducer().getCode());
                dto.setProducerPhone(batch.getProduct().getProducer().getPhone());
                dto.setProducerEmail(batch.getProduct().getProducer().getContactEmail());
                dto.setIsProducerVerified(batch.getProduct().getProducer().getIsVerified());
                if (batch.getProduct().getProducer().getLocation() != null) {
                    dto.setProducerProvince(batch.getProduct().getProducer().getLocation().getProvince());
                    dto.setProducerAddress(batch.getProduct().getProducer().getLocation().getAddressDetail());
                }
            }

            OcopCertificate cert = batch.getProduct().getOcopCertificate();
            if (cert != null) {
                dto.setCertificateCode(cert.getCertificateCode());
                dto.setCertificateStarRating(cert.getStarRating());
                dto.setCertIssuedDate(cert.getIssuedDate());
                dto.setCertExpiryDate(cert.getExpiryDate());
                dto.setCertIssuingAuthority(cert.getIssuingAuthority());
                dto.setCertDocumentUrl(cert.getDocumentUrl());
            }
        }

        dto.setEvents(events);
        dto.setIsIntegrityVerified(true);
        dto.setVerifiedAt(LocalDateTime.now());
        return dto;
    }

    public Long getBatchId() {
        return batchId;
    }

    public void setBatchId(Long batchId) {
        this.batchId = batchId;
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

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductSlug() {
        return productSlug;
    }

    public void setProductSlug(String productSlug) {
        this.productSlug = productSlug;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public Short getOcopStarRating() {
        return ocopStarRating;
    }

    public void setOcopStarRating(Short ocopStarRating) {
        this.ocopStarRating = ocopStarRating;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCulturalStory() {
        return culturalStory;
    }

    public void setCulturalStory(String culturalStory) {
        this.culturalStory = culturalStory;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getProducerId() {
        return producerId;
    }

    public void setProducerId(Long producerId) {
        this.producerId = producerId;
    }

    public String getProducerName() {
        return producerName;
    }

    public void setProducerName(String producerName) {
        this.producerName = producerName;
    }

    public String getProducerCode() {
        return producerCode;
    }

    public void setProducerCode(String producerCode) {
        this.producerCode = producerCode;
    }

    public String getProducerProvince() {
        return producerProvince;
    }

    public void setProducerProvince(String producerProvince) {
        this.producerProvince = producerProvince;
    }

    public String getProducerAddress() {
        return producerAddress;
    }

    public void setProducerAddress(String producerAddress) {
        this.producerAddress = producerAddress;
    }

    public String getProducerPhone() {
        return producerPhone;
    }

    public void setProducerPhone(String producerPhone) {
        this.producerPhone = producerPhone;
    }

    public String getProducerEmail() {
        return producerEmail;
    }

    public void setProducerEmail(String producerEmail) {
        this.producerEmail = producerEmail;
    }

    public Boolean getIsProducerVerified() {
        return isProducerVerified;
    }

    public void setIsProducerVerified(Boolean isProducerVerified) {
        this.isProducerVerified = isProducerVerified;
    }

    public String getCertificateCode() {
        return certificateCode;
    }

    public void setCertificateCode(String certificateCode) {
        this.certificateCode = certificateCode;
    }

    public Short getCertificateStarRating() {
        return certificateStarRating;
    }

    public void setCertificateStarRating(Short certificateStarRating) {
        this.certificateStarRating = certificateStarRating;
    }

    public LocalDate getCertIssuedDate() {
        return certIssuedDate;
    }

    public void setCertIssuedDate(LocalDate certIssuedDate) {
        this.certIssuedDate = certIssuedDate;
    }

    public LocalDate getCertExpiryDate() {
        return certExpiryDate;
    }

    public void setCertExpiryDate(LocalDate certExpiryDate) {
        this.certExpiryDate = certExpiryDate;
    }

    public String getCertIssuingAuthority() {
        return certIssuingAuthority;
    }

    public void setCertIssuingAuthority(String certIssuingAuthority) {
        this.certIssuingAuthority = certIssuingAuthority;
    }

    public String getCertDocumentUrl() {
        return certDocumentUrl;
    }

    public void setCertDocumentUrl(String certDocumentUrl) {
        this.certDocumentUrl = certDocumentUrl;
    }

    public List<ProductionEvent> getEvents() {
        return events;
    }

    public void setEvents(List<ProductionEvent> events) {
        this.events = events;
    }

    public Boolean getIsIntegrityVerified() {
        return isIntegrityVerified;
    }

    public void setIsIntegrityVerified(Boolean isIntegrityVerified) {
        this.isIntegrityVerified = isIntegrityVerified;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }
}
