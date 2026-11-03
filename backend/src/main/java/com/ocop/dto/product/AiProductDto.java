package com.ocop.dto.product;

import java.math.BigDecimal;

public class AiProductDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private String unit;
    private Short ocopStarRating;
    private String producerName;
    private String province;
    private String culturalStory;

    public AiProductDto() {
    }

    public AiProductDto(Long id, String name, BigDecimal price, String unit,
                        Short ocopStarRating, String producerName, String province, String culturalStory) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.unit = unit;
        this.ocopStarRating = ocopStarRating;
        this.producerName = producerName;
        this.province = province;
        this.culturalStory = culturalStory;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Short getOcopStarRating() {
        return ocopStarRating;
    }

    public void setOcopStarRating(Short ocopStarRating) {
        this.ocopStarRating = ocopStarRating;
    }

    public String getProducerName() {
        return producerName;
    }

    public void setProducerName(String producerName) {
        this.producerName = producerName;
    }

    public String getProvince() {
        return province;
    }

    public void setProvince(String province) {
        this.province = province;
    }

    public String getCulturalStory() {
        return culturalStory;
    }

    public void setCulturalStory(String culturalStory) {
        this.culturalStory = culturalStory;
    }
}
