package com.agriease.backend.service;

import com.agriease.backend.config.JwtUtil;
import com.agriease.backend.dto.LoginRequest;
import com.agriease.backend.dto.LoginResponse;
import com.agriease.backend.dto.RegisterRequest;
import com.agriease.backend.entity.RoleType;
import com.agriease.backend.entity.User;
import com.agriease.backend.entity.UserRole;
import com.agriease.backend.repository.UserRepository;
import com.agriease.backend.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository repo;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository repo, UserRoleRepository userRoleRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.repo = repo;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public User register(RegisterRequest request) {
        RoleType requestedRole = parseRole(request.getRole());
        if (requestedRole == null) {
            throw new RuntimeException("Role is required");
        }

        Optional<User> existingOpt = repo.findByEmail(request.getEmail());
        if (existingOpt.isPresent()) {
            User existing = existingOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), existing.getPassword())) {
                throw new RuntimeException("Password does not match existing account");
            }
            boolean alreadyLinked = userRoleRepository.findByUserAndRole(existing, requestedRole).isPresent();
            if (alreadyLinked) {
                throw new RuntimeException("Role already linked to this account");
            }
            existing.addRole(requestedRole);
            return repo.save(existing);
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActiveRole(requestedRole);
        user.addRole(requestedRole);

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

        normalizeLegacyCustomerRole(user);

        if (user.getRoles().isEmpty() && user.getActiveRole() != null) {
            user.addRole(user.getActiveRole().canonical());
            repo.save(user);
        }

        if (user.getActiveRole() == null) {
            RoleType fallback = user.getRoles().stream()
                    .map(UserRole::getRole)
                    .map(RoleType::canonical)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No roles assigned"));
            user.setActiveRole(fallback);
            repo.save(user);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getActiveRole().canonical());

        return new LoginResponse(
                token,
                user.getActiveRole().canonical().name(),
                user.getName(),
                user.getId(),
                toRoleNames(user)
        );
    }

    public LoginResponse switchRole(String email, String targetRole) {
        RoleType requestedRole = parseRole(targetRole);
        if (requestedRole == null) {
            throw new RuntimeException("Role is required");
        }

        User user = repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean hasRole = userRoleRepository.findByUserAndRole(user, requestedRole).isPresent();
        if (!hasRole) {
            throw new RuntimeException("Role not linked to this account");
        }

        user.setActiveRole(requestedRole);
        repo.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), requestedRole.canonical());
        return new LoginResponse(token, requestedRole.canonical().name(), user.getName(), user.getId(), toRoleNames(user));
    }

    private RoleType parseRole(String role) {
        if (role == null) return null;
        try {
            return RoleType.fromInput(role);
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Unsupported role: " + role);
        }
    }

    private ArrayList<String> toRoleNames(User user) {
        LinkedHashSet<String> roles = new LinkedHashSet<>();
        user.getRoles().forEach(r -> roles.add(r.getRole().canonical().name()));
        return new ArrayList<>(roles);
    }

    private void normalizeLegacyCustomerRole(User user) {
        boolean changed = false;

        if (user.getActiveRole() == RoleType.CUSTOMER) {
            user.setActiveRole(RoleType.FARMER);
            changed = true;
        }

        boolean hasCustomerRole = user.getRoles().stream().anyMatch(r -> r.getRole() == RoleType.CUSTOMER);
        if (hasCustomerRole) {
            user.getRoles().removeIf(r -> r.getRole() == RoleType.CUSTOMER);
            if (user.getRoles().stream().noneMatch(r -> r.getRole() == RoleType.FARMER)) {
                user.addRole(RoleType.FARMER);
            }
            changed = true;
        }

        if (changed) {
            repo.save(user);
        }
    }
}
