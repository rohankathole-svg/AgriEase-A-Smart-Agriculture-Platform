package com.agriease.backend.dto;

public class WeeklyScheduleRequest {
    private String cropName;
    private String scheduleType;
    private Integer totalWeeks;
    private Double landAreaAcres;

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public String getScheduleType() {
        return scheduleType;
    }

    public void setScheduleType(String scheduleType) {
        this.scheduleType = scheduleType;
    }

    public Integer getTotalWeeks() {
        return totalWeeks;
    }

    public void setTotalWeeks(Integer totalWeeks) {
        this.totalWeeks = totalWeeks;
    }

    public Double getLandAreaAcres() {
        return landAreaAcres;
    }

    public void setLandAreaAcres(Double landAreaAcres) {
        this.landAreaAcres = landAreaAcres;
    }
}
