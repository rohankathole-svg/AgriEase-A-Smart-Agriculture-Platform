package com.agriease.delivery.controllers;

import com.agriease.delivery.dto.OrderStatusResponseDto;
import com.agriease.delivery.dto.OrderTrackingResponseDto;
import com.agriease.delivery.dto.AvailableDeliveryAgentDto;
import com.agriease.delivery.services.DeliveryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/api/orders")
public class OrderDeliveryController {

    private final DeliveryService deliveryService;

    public OrderDeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping("/{orderId}/confirm")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<OrderStatusResponseDto> confirmOrder(@PathVariable Long orderId, Authentication authentication) {
        return ResponseEntity.ok(deliveryService.confirmOrder(orderId, authentication.getName()));
    }

    @PostMapping("/{orderId}/assign-agent/{agentId}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<OrderStatusResponseDto> assignAgent(@PathVariable Long orderId,
                                                              @PathVariable Long agentId,
                                                              Authentication authentication) {
        return ResponseEntity.ok(deliveryService.assignOrderToAgent(orderId, agentId, authentication.getName()));
    }

    @GetMapping("/delivery-agents/available")
    @PreAuthorize("hasRole('SUPPLIER')")
    public ResponseEntity<List<AvailableDeliveryAgentDto>> getAvailableAgents() {
        return ResponseEntity.ok(deliveryService.getAvailableAgents());
    }

    @GetMapping("/{orderId}/tracking")
    @PreAuthorize("hasAnyRole('FARMER','SUPPLIER')")
    public ResponseEntity<OrderTrackingResponseDto> getTracking(@PathVariable("orderId") Long orderId) {
        return ResponseEntity.ok(deliveryService.getOrderTracking(orderId));
    }
}
