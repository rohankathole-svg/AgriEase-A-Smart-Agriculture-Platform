package com.agriease.backend.controller;

import com.agriease.backend.dto.LoginResponse;
import com.agriease.backend.dto.SwitchRoleRequest;
import com.agriease.backend.service.AuthService;
import com.agriease.backend.service.UserAccountService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping({"/api/user", "/user"})
public class UserController {

    private final AuthService authService;
    private final UserAccountService userAccountService;

    public UserController(AuthService authService, UserAccountService userAccountService) {
        this.authService = authService;
        this.userAccountService = userAccountService;
    }

    @PostMapping("/switch-role")
    @PreAuthorize("hasAnyRole('FARMER','SUPPLIER')")
    public LoginResponse switchRole(@RequestBody SwitchRoleRequest request, Authentication authentication) {
        return authService.switchRole(authentication.getName(), request.getRole());
    }

    @DeleteMapping("/account")
    @PreAuthorize("hasAnyRole('FARMER','SUPPLIER')")
    public Map<String, String> deleteOwnAccount(Authentication authentication) {
        userAccountService.deleteOwnAccount(authentication.getName());
        return Map.of("status", "success", "message", "Account deleted successfully");
    }
}
