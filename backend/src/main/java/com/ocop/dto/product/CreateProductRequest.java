package com.ocop.dto.product;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 200, message = "Tên sản phẩm tối đa 200 ký tự")
    private String name;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private Long producerId; // Nếu là Admin có thể chỉ định producer, nếu là Producer thì lấy theo producer của user

    @NotBlank(message = "Mô tả sản phẩm không được để trống")
    private String description;

    private String culturalStory;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "1000", message = "Giá tối thiểu là 1.000 VNĐ")
    private BigDecimal price;

    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity = 100;

    private String unit = "Hộp";

    @NotNull(message = "Hạng sao OCOP không được để trống")
    @Min(value = 3, message = "Hạng sao OCOP tối thiểu là 3 sao")
    @Max(value = 5, message = "Hạng sao OCOP tối đa là 5 sao")
    private Short ocopStarRating = 4;

    private String thumbnail;

    public CreateProductRequest() {}

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public Long getProducerId() {
        return producerId;
    }

    public void setProducerId(Long producerId) {
        this.producerId = producerId;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Short getOcopStarRating() {
        return ocopStarRating;
    }

    public void setOcopStarRating(Short ocopStarRating) {
        this.ocopStarRating = ocopStarRating;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }
}
