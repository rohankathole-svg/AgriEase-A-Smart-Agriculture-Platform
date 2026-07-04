package com.agriease.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CropAdvisorResponse {
    private Long recordId;
    private String location;
    private Double latitude;
    private Double longitude;
    private Double temperatureCelsius;
    private Double humidityPercentage;
    private String weatherSource;
    private LocalDateTime createdAt;
    private List<CropSuitabilityDto> recommendations;

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getTemperatureCelsius() {
        return temperatureCelsius;
    }

    public void setTemperatureCelsius(Double temperatureCelsius) {
        this.temperatureCelsius = temperatureCelsius;
    }

    public Double getHumidityPercentage() {
        return humidityPercentage;
    }

    public void setHumidityPercentage(Double humidityPercentage) {
        this.humidityPercentage = humidityPercentage;
    }

    public String getWeatherSource() {
        return weatherSource;
    }

    public void setWeatherSource(String weatherSource) {
        this.weatherSource = weatherSource;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<CropSuitabilityDto> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<CropSuitabilityDto> recommendations) {
        this.recommendations = recommendations;
    }
}
