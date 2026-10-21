package com.ocop.dto.category;

public class CategoryDto {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private int productCount;

    public CategoryDto() {}

    public CategoryDto(Long id, String name, String slug, String description, String iconUrl, int productCount) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.iconUrl = iconUrl;
        this.productCount = productCount;
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

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public void setIconUrl(String iconUrl) {
        this.iconUrl = iconUrl;
    }

    public int getProductCount() {
        return productCount;
    }

    public void setProductCount(int productCount) {
        this.productCount = productCount;
    }
}
