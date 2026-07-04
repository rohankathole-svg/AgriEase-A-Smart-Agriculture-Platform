package com.agriease.backend.controller;

import com.agriease.backend.entity.Booking;
import com.agriease.backend.entity.Equipment;
import com.agriease.backend.dto.ProductMarketplaceDto;
import com.agriease.backend.service.BookingService;
import com.agriease.backend.service.CropAdvisorService;
import com.agriease.backend.service.EquipmentService;
import com.agriease.backend.service.LandMeasurementService;
import com.agriease.backend.service.OrderService;
import com.agriease.backend.service.ProductService;
import com.agriease.backend.service.WeeklyScheduleService;
import com.agriease.backend.dto.CropAdvisorRequest;
import com.agriease.backend.dto.CropAdvisorResponse;
import com.agriease.backend.dto.LandMeasurementRequest;
import com.agriease.backend.dto.LandMeasurementResponse;
import com.agriease.backend.dto.WeeklyScheduleRequest;
import com.agriease.backend.dto.WeeklyScheduleResponse;
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
    private final CropAdvisorService cropAdvisorService;
    private final LandMeasurementService landMeasurementService;
    private final WeeklyScheduleService weeklyScheduleService;

    public FarmerController(EquipmentService equipmentService,
                            BookingService bookingService,
                            ProductService productService,
                            OrderService orderService,
                            CropAdvisorService cropAdvisorService,
                            LandMeasurementService landMeasurementService,
                            WeeklyScheduleService weeklyScheduleService) {
        this.equipmentService = equipmentService;
        this.bookingService = bookingService;
        this.productService = productService;
        this.orderService = orderService;
        this.cropAdvisorService = cropAdvisorService;
        this.landMeasurementService = landMeasurementService;
        this.weeklyScheduleService = weeklyScheduleService;
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

    @PostMapping("/crop-advisor/recommendations")
    public CropAdvisorResponse generateCropRecommendations(@RequestBody CropAdvisorRequest request, Authentication authentication) {
        return cropAdvisorService.generateRecommendations(authentication.getName(), request);
    }

    @GetMapping("/crop-advisor/history")
    public List<CropAdvisorResponse> cropAdvisorHistory(Authentication authentication) {
        return cropAdvisorService.getHistory(authentication.getName());
    }

    @PostMapping("/land-measurements")
    public LandMeasurementResponse saveLandMeasurement(@RequestBody LandMeasurementRequest request, Authentication authentication) {
        return landMeasurementService.saveMeasurement(authentication.getName(), request);
    }

    @GetMapping("/land-measurements")
    public List<LandMeasurementResponse> getLandMeasurements(Authentication authentication) {
        return landMeasurementService.getHistory(authentication.getName());
    }

    @PostMapping("/weekly-schedules")
    public WeeklyScheduleResponse generateWeeklySchedule(@RequestBody WeeklyScheduleRequest request, Authentication authentication) {
        return weeklyScheduleService.generate(authentication.getName(), request);
    }

    @GetMapping("/weekly-schedules")
    public List<WeeklyScheduleResponse> getWeeklySchedules(Authentication authentication) {
        return weeklyScheduleService.getHistory(authentication.getName());
    }

}

