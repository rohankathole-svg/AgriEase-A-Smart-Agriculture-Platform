package com.agriease.delivery.controllers;

import com.agriease.delivery.dto.AgentOrderDto;
import com.agriease.delivery.dto.OrderStatusResponseDto;
import com.agriease.delivery.services.DeliveryService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
public class DeliveryAgentController {

    private final DeliveryService deliveryService;

    public DeliveryAgentController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping("/api/agent/orders")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<List<AgentOrderDto>> getAgentOrders(Authentication authentication) {
        return ResponseEntity.ok(deliveryService.getAgentOrders(authentication.getName()));
    }

    @GetMapping("/api/agent/profile")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<Map<String, Object>> getAgentProfile(Authentication authentication) {
        return ResponseEntity.ok(deliveryService.getAgentProfile(authentication.getName()));
    }

    @PutMapping("/api/agent/profile")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<Map<String, Object>> updateAgentProfile(@RequestBody Map<String, String> updates,
                                                                  Authentication authentication) {
        return ResponseEntity.ok(deliveryService.updateAgentProfile(authentication.getName(), updates));
    }

    @PutMapping("/api/delivery/{orderId}/accept")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> acceptOrder(@PathVariable Long orderId,
                                                              @RequestBody(required = false) Map<String, String> body,
                                                              Authentication authentication) {
        String location = body == null ? null : body.get("location");
        return ResponseEntity.ok(deliveryService.acceptOrder(orderId, authentication.getName(), location));
    }

    @PutMapping("/api/delivery/{orderId}/reject")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> rejectOrder(@PathVariable Long orderId,
                                                              @RequestBody(required = false) Map<String, String> body,
                                                              Authentication authentication) {
        String location = body == null ? null : body.get("location");
        String reason = body == null ? null : body.get("reason");
        return ResponseEntity.ok(deliveryService.rejectOrder(orderId, authentication.getName(), location, reason));
    }

    @PutMapping("/api/delivery/{orderId}/pickup")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> pickupOrder(@PathVariable Long orderId,
                                                              @RequestBody(required = false) Map<String, String> body,
                                                              Authentication authentication) {
        String location = body == null ? null : body.get("location");
        return ResponseEntity.ok(deliveryService.pickupOrder(orderId, authentication.getName(), location));
    }

    @PutMapping("/api/delivery/{orderId}/out-for-delivery")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> outForDelivery(@PathVariable Long orderId,
                                                                 @RequestBody(required = false) Map<String, String> body,
                                                                 Authentication authentication) {
        String location = body == null ? null : body.get("location");
        return ResponseEntity.ok(deliveryService.outForDelivery(orderId, authentication.getName(), location));
    }

    @PutMapping("/api/delivery/{orderId}/delivered")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> delivered(@PathVariable Long orderId,
                                                            @RequestBody(required = false) Map<String, String> body,
                                                            Authentication authentication) {
        String location = body == null ? null : body.get("location");
        return ResponseEntity.ok(deliveryService.markDelivered(orderId, authentication.getName(), location));
    }

    @PostMapping(value = "/api/delivery/{orderId}/upload-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<OrderStatusResponseDto> uploadProof(@PathVariable Long orderId,
                                                              @RequestParam("file") MultipartFile file,
                                                              @RequestParam(required = false) String location,
                                                              Authentication authentication) {
        return ResponseEntity.ok(deliveryService.uploadDeliveryProof(orderId, authentication.getName(), file, location));
    }

    @PutMapping("/api/delivery/{orderId}/collect-payment")
    @PreAuthorize("hasRole('DELIVERY_AGENT')")
    public ResponseEntity<Map<String, Object>> collectCodPayment(@PathVariable Long orderId,
                                                                  Authentication authentication) {
        return ResponseEntity.ok(deliveryService.collectCodPayment(orderId, authentication.getName()));
    }
}
