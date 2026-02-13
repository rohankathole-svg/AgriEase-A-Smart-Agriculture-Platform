package com.agriease.backend.service;

import com.agriease.backend.config.JwtUtil;
import com.agriease.backend.dto.LoginRequest;
import com.agriease.backend.dto.LoginResponse;
import com.agriease.backend.dto.RegisterRequest;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository repo;

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository repo, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public User register(RegisterRequest request) {
        if (repo.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        return repo.save(user);
    }

    public LoginResponse login(LoginRequest request) {
        User user = repo.findByEmail(request.email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        boolean matches = passwordEncoder.matches(request.password, user.getPassword());

        // Support legacy non-BCrypt passwords by re-encoding on successful match
        if (!matches) {
            if (request.password != null && request.password.equals(user.getPassword())) {
                // migrate to BCrypt
                user.setPassword(passwordEncoder.encode(request.password));
                repo.save(user);
                matches = true;
            }
        }

        if (!matches) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new LoginResponse(token, user.getRole(), user.getName(), user.getId());
    }
}
