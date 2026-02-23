package com.agriease.backend.controller;

import com.agriease.backend.entity.Booking;
import com.agriease.backend.entity.Equipment;
import com.agriease.backend.dto.ProductMarketplaceDto;
import com.agriease.backend.service.BookingService;
import com.agriease.backend.service.EquipmentService;
import com.agriease.backend.service.OrderService;
import com.agriease.backend.service.ProductService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/farmer")
@PreAuthorize("hasRole('FARMER')")
public class FarmerController {

    private final EquipmentService equipmentService;
    private final BookingService bookingService;
    private final ProductService productService;
    private final OrderService orderService;

    public FarmerController(EquipmentService equipmentService,
                            BookingService bookingService,
                            ProductService productService,
                            OrderService orderService) {
        this.equipmentService = equipmentService;
        this.bookingService = bookingService;
        this.productService = productService;
        this.orderService = orderService;
    }

    @GetMapping("/equipment")
    public List<Equipment> listEquipment() {
        return equipmentService.listAvailableEquipment();
    }

    @PostMapping("/bookings")
    public Booking createBooking(
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        String email = authentication.getName();
        return bookingService.createBooking(equipmentId, email, startDate, endDate);
    }

    @GetMapping("/bookings")
    public List<Booking> myBookings(Authentication authentication) {
        String email = authentication.getName();
        return bookingService.getFarmerBookings(email);
    }

    @GetMapping("/products")
    public List<ProductMarketplaceDto> listProducts() {
        return productService.getMarketplaceProducts();
    }

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

