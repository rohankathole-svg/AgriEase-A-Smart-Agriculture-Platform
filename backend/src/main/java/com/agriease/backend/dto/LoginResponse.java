package com.agriease.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class LoginResponse {
    private String token;
    private String role;
    private String name;
    private Long userId;
    private List<String> roles;

    public LoginResponse(String token, String role, String name, Long userId, List<String> roles) {
        this.token = token;
        this.role = role;
        this.name = name;
        this.userId = userId;
        this.roles = roles != null ? new ArrayList<>(roles) : new ArrayList<>();
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
