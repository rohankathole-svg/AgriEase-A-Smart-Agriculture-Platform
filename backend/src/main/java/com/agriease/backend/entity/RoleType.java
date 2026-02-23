package com.agriease.backend.entity;

public enum RoleType {
    FARMER,
    SUPPLIER,
    CUSTOMER;

    public RoleType canonical() {
        return this == CUSTOMER ? FARMER : this;
    }

    public static RoleType fromInput(String role) {
        if (role == null) {
            return null;
        }

        RoleType parsed = RoleType.valueOf(role.trim().toUpperCase());
        return parsed.canonical();
    }
}
