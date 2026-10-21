package com.ocop.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ocop_certificates")
public class OcopCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(name = "certificate_code", nullable = false, length = 50)
    private String certificateCode;

    @Column(name = "star_rating", nullable = false)
    private Short starRating;

    @Column(name = "issued_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate issuedDate;

    @Column(name = "expiry_date", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;

    @Column(name = "issuing_authority", nullable = false, length = 150)
    private String issuingAuthority;

    @Column(name = "document_url", length = 255)
    private String documentUrl;

    @Column(name = "is_sample_data")
    private Boolean isSampleData = false;

    @Column(name = "status", length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, EXPIRED

    @Column(name = "verified_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    public OcopCertificate() {}

    public OcopCertificate(Product product, String certificateCode, Short starRating, LocalDate issuedDate, LocalDate expiryDate, String issuingAuthority) {
        this.product = product;
        this.certificateCode = certificateCode;
        this.starRating = starRating;
        this.issuedDate = issuedDate;
        this.expiryDate = expiryDate;
        this.issuingAuthority = issuingAuthority;
    }

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

    public Boolean getIsSampleData() {
        return isSampleData;
    }

    public void setIsSampleData(Boolean isSampleData) {
        this.isSampleData = isSampleData;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
}
