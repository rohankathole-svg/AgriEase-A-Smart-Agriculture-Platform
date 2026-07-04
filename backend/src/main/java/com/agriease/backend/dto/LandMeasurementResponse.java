package com.agriease.backend.dto;

import java.time.LocalDateTime;

public class LandMeasurementResponse {
    private Long id;
    private String locationLabel;
    private Integer pointCount;
    private Double areaSquareMeters;
    private Double areaAcres;
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLocationLabel() {
        return locationLabel;
    }

    public void setLocationLabel(String locationLabel) {
        this.locationLabel = locationLabel;
    }

    public Integer getPointCount() {
        return pointCount;
    }

    public void setPointCount(Integer pointCount) {
        this.pointCount = pointCount;
    }

    public Double getAreaSquareMeters() {
        return areaSquareMeters;
    }

    public void setAreaSquareMeters(Double areaSquareMeters) {
        this.areaSquareMeters = areaSquareMeters;
    }

    public Double getAreaAcres() {
        return areaAcres;
    }

    public void setAreaAcres(Double areaAcres) {
        this.areaAcres = areaAcres;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
