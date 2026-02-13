package com.agriease.backend.dto;

public class DiseasePredictionResponse {
    private String disease;
    private double confidence;
    private String recommendation;
    private String description;
    private String prevention;
    private String buy_link;

    public String getDisease() {
        return disease;
    }

    public void setDisease(String disease) {
        this.disease = disease;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrevention() {
        return prevention;
    }

    public void setPrevention(String prevention) {
        this.prevention = prevention;
    }

    public String getBuy_link() {
        return buy_link;
    }

    public void setBuy_link(String buy_link) {
        this.buy_link = buy_link;
    }
}

