package com.agriease.delivery.dto;

import java.time.LocalDateTime;

public class OrderTimelineEventDto {
    private String status;
    private LocalDateTime time;
    private String location;
    private String photoProofUrl;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhotoProofUrl() {
        return photoProofUrl;
    }

    public void setPhotoProofUrl(String photoProofUrl) {
        this.photoProofUrl = photoProofUrl;
    }
}

