package com.agriease.backend.dto;

import java.util.List;

public class LandMeasurementRequest {
    private String locationLabel;
    private List<GeoPointDto> points;

    public String getLocationLabel() {
        return locationLabel;
    }

    public void setLocationLabel(String locationLabel) {
        this.locationLabel = locationLabel;
    }

    public List<GeoPointDto> getPoints() {
        return points;
    }

    public void setPoints(List<GeoPointDto> points) {
        this.points = points;
    }
}
