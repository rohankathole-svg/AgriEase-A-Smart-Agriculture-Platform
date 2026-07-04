package com.agriease.delivery.dto;

public class AgentOrderDto {
    private Long orderId;
    private String status;
    private String supplierPickupLocation;
    private String farmerDeliveryLocation;
    private String farmerName;
    private String phone;
    private String paymentMethod;
    private String paymentStatus;
    private Double totalAmount;

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

    public String getSupplierPickupLocation() {
        return supplierPickupLocation;
    }

    public void setSupplierPickupLocation(String supplierPickupLocation) {
        this.supplierPickupLocation = supplierPickupLocation;
    }

    public String getFarmerDeliveryLocation() {
        return farmerDeliveryLocation;
    }

    public void setFarmerDeliveryLocation(String farmerDeliveryLocation) {
        this.farmerDeliveryLocation = farmerDeliveryLocation;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
}

