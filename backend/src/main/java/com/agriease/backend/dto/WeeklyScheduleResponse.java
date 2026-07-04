package com.agriease.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class WeeklyScheduleResponse {
    private Long id;
    private String cropName;
    private String scheduleType;
    private Integer totalWeeks;
    private Double landAreaAcres;
    private LocalDateTime createdAt;
    private List<WeekPlanDto> weeks;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<WeekPlanDto> getWeeks() {
        return weeks;
    }

    public void setWeeks(List<WeekPlanDto> weeks) {
        this.weeks = weeks;
    }
}
