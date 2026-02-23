package com.agriease.backend.config;

import com.agriease.backend.entity.RoleType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();
        
        logger.debug("JWT Filter - {} {}", method, requestURI);
        
        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(token);
                logger.debug("Token found for user: {}", username);
            } catch (Exception e) {
                logger.error("Failed to extract username from token: {}", e.getMessage());
            }
        } else {
            logger.debug("No Authorization header or doesn't start with Bearer");
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtUtil.isTokenValid(token, userDetails)) {
                    String role = jwtUtil.extractRole(token);
                    logger.debug("Token valid for user: {}, role: {}", username, role);

                    if (role != null) {
                        try {
                            role = RoleType.fromInput(role).name();
                        } catch (IllegalArgumentException ignored) {
                            // Keep raw token role when claim is unknown.
                        }
                    }
                    
                    // Add ROLE_ prefix if not already present
                    String roleWithPrefix = role != null && !role.startsWith("ROLE_") 
                        ? "ROLE_" + role 
                        : role;

                    List<GrantedAuthority> authorities;
                    if (roleWithPrefix != null && !roleWithPrefix.isBlank()) {
                        authorities = List.of(new SimpleGrantedAuthority(roleWithPrefix));
                    } else {
                        authorities = userDetails.getAuthorities().stream()
                                .map(a -> new SimpleGrantedAuthority(a.getAuthority()))
                                .collect(Collectors.toList());
                        logger.debug("Role claim missing/invalid. Falling back to userDetails authorities: {}", authorities);
                    }
                    
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    authorities
                            );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set for user: {} with authority: {}", username, roleWithPrefix);
                } else {
                    logger.warn("Token invalid for user: {}", username);
                }
            } catch (Exception e) {
                logger.error("Error during authentication: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
