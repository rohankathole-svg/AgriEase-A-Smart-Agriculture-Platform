package com.agriease.backend.controller;

import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.Product;
import com.agriease.backend.service.EquipmentService;
import com.agriease.backend.service.OrderService;
import com.agriease.backend.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/supplier")
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierController {

    private final EquipmentService equipmentService;
    private final ProductService productService;
    private final OrderService orderService;

    public SupplierController(EquipmentService equipmentService,
                              ProductService productService,
                              OrderService orderService) {
        this.equipmentService = equipmentService;
        this.productService = productService;
        this.orderService = orderService;
    }

    // Equipment CRUD

    @PostMapping("/equipment")
    public Equipment addEquipment(@RequestBody Equipment equipment,
                                  Authentication authentication) {
        String email = authentication.getName();
        return equipmentService.createEquipment(email, equipment);
    }

    @GetMapping("/equipment")
    public List<Equipment> myEquipment(Authentication authentication) {
        String email = authentication.getName();
        return equipmentService.listSupplierEquipment(email);
    }

    @DeleteMapping("/equipment/{id}")
    public void deleteEquipment(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        equipmentService.deleteEquipment(id, email);
    }

    @PutMapping("/equipment/{id}")
    public Equipment updateEquipment(@PathVariable Long id,
                                     @RequestBody Equipment equipment,
                                     Authentication authentication) {
        String email = authentication.getName();
        return equipmentService.updateEquipment(id, email, equipment);
    }

    // Order Management

    @GetMapping("/orders")
    public List<Order> getSupplierOrders(Authentication authentication) {
        return orderService.getSupplierOrders(authentication.getName());
    }

    @GetMapping("/debug/auth")
    public ResponseEntity<?> debugAuth(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "username", authentication.getName(),
            "authorities", authentication.getAuthorities().toString(),
            "principal", authentication.getPrincipal().toString()
        ));
    }

    @PutMapping("/orders/{id}/status")
    public void updateOrderStatus(@PathVariable Long id,
                                   @RequestBody Map<String, String> request) {
        String status = request.get("status");
        orderService.updateOrderStatus(id, status);
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            orderService.deleteSupplierOrder(id, email);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Order deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Profile Management

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@RequestBody Map<String, String> updates, Authentication authentication) {
        String email = authentication.getName();
        return orderService.updateUserProfile(email, updates);
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile(Authentication authentication) {
        String email = authentication.getName();
        return orderService.getUserProfile(email);
    }
}

