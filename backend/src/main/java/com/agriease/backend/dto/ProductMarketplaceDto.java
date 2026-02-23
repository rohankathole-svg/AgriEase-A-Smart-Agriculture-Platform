package com.agriease.backend.dto;

public class ProductMarketplaceDto {
    private Long id;
    private String name;
    private String description;
    private double price;
    private String imageUrl;
    private String type;
    private SupplierBasicDto supplier;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public SupplierBasicDto getSupplier() {
        return supplier;
    }

    public void setSupplier(SupplierBasicDto supplier) {
        this.supplier = supplier;
    }
}
