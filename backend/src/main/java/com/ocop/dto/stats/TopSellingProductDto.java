package com.ocop.dto.stats;

import java.math.BigDecimal;

public class TopSellingProductDto {
    private Long productId;
    private String productName;
    private String thumbnail;
    private Short ocopStarRating;
    private String unit;
    private Integer quantitySold = 0;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Integer currentStock = 0;

    public TopSellingProductDto() {}

    public TopSellingProductDto(Long productId, String productName, String thumbnail, Short ocopStarRating, String unit, Integer quantitySold, BigDecimal totalRevenue, Integer currentStock) {
        this.productId = productId;
        this.productName = productName;
        this.thumbnail = thumbnail;
        this.ocopStarRating = ocopStarRating;
        this.unit = unit;
        this.quantitySold = quantitySold;
        this.totalRevenue = totalRevenue;
        this.currentStock = currentStock;
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getQuantitySold() {
        return quantitySold;
    }

    public void setQuantitySold(Integer quantitySold) {
        this.quantitySold = quantitySold;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Integer getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
    }
}
