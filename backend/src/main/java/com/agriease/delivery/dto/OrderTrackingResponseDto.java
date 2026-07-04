package com.agriease.delivery.dto;

import java.util.List;

public class OrderTrackingResponseDto {
    private Long orderId;
    private String status;
    private List<OrderTimelineEventDto> timeline;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<OrderTimelineEventDto> getTimeline() {
        return timeline;
    }

    public void setTimeline(List<OrderTimelineEventDto> timeline) {
        this.timeline = timeline;
    }
}

