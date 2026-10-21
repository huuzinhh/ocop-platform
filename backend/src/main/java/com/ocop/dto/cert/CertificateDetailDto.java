package com.ocop.dto.cert;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CertificateDetailDto {

    private Long certificateId;
    private String certificateCode;
    private Short starRating;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate issuedDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    private String issuingAuthority;
    private String documentUrl;
    private String status;
    private Boolean isSampleData;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime verifiedAt;
    private String verifiedBy;
    private String rejectionReason;

    // Sản phẩm liên kết
    private Long productId;
    private String productName;
    private String productThumbnail;
    private java.math.BigDecimal productPrice;
    private String productStatus;

    // Chủ thể sản xuất
    private Long producerId;
    private String producerName;
    private String producerCode;
    private String producerProvince;

    public CertificateDetailDto() {}

    public Long getCertificateId() {
        return certificateId;
    }

    public void setCertificateId(Long certificateId) {
        this.certificateId = certificateId;
    }

    public String getCertificateCode() {
        return certificateCode;
    }

    public void setCertificateCode(String certificateCode) {
        this.certificateCode = certificateCode;
    }

    public Short getStarRating() {
        return starRating;
    }

    public void setStarRating(Short starRating) {
        this.starRating = starRating;
    }

    public LocalDate getIssuedDate() {
        return issuedDate;
    }

    public void setIssuedDate(LocalDate issuedDate) {
        this.issuedDate = issuedDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getIssuingAuthority() {
        return issuingAuthority;
    }

    public void setIssuingAuthority(String issuingAuthority) {
        this.issuingAuthority = issuingAuthority;
    }

    public String getDocumentUrl() {
        return documentUrl;
    }

    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsSampleData() {
        return isSampleData;
    }

    public void setIsSampleData(Boolean isSampleData) {
        this.isSampleData = isSampleData;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    public String getProductThumbnail() {
        return productThumbnail;
    }

    public void setProductThumbnail(String productThumbnail) {
        this.productThumbnail = productThumbnail;
    }

    public java.math.BigDecimal getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(java.math.BigDecimal productPrice) {
        this.productPrice = productPrice;
    }

    public String getProductStatus() {
        return productStatus;
    }

    public void setProductStatus(String productStatus) {
        this.productStatus = productStatus;
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
}
