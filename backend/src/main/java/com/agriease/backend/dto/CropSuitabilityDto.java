package com.agriease.backend.dto;

public class CropSuitabilityDto {
    private String cropName;
    private double suitabilityPercentage;
    private String reason;

    public CropSuitabilityDto() {
    }

    public CropSuitabilityDto(String cropName, double suitabilityPercentage, String reason) {
        this.cropName = cropName;
        this.suitabilityPercentage = suitabilityPercentage;
        this.reason = reason;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public double getSuitabilityPercentage() {
        return suitabilityPercentage;
    }

    public void setSuitabilityPercentage(double suitabilityPercentage) {
        this.suitabilityPercentage = suitabilityPercentage;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
