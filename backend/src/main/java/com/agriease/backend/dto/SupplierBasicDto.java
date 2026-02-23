package com.agriease.backend.dto;

public class SupplierBasicDto {
    private Long id;
    private String name;
    private Double rating;
    private String location;

    public SupplierBasicDto() {
    }

    public SupplierBasicDto(Long id, String name, Double rating, String location) {
        this.id = id;
        this.name = name;
        this.rating = rating;
        this.location = location;
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

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
