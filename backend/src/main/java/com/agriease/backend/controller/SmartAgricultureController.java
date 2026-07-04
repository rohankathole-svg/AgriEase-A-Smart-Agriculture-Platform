package com.agriease.backend.controller;

import com.agriease.backend.dto.*;
import com.agriease.backend.service.CropAdvisorService;
import com.agriease.backend.service.LandMeasurementService;
import com.agriease.backend.service.WeeklyScheduleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin
@RequestMapping({"/farmer/smart", "/api/farmer/smart"})
@PreAuthorize("hasRole('FARMER')")
public class SmartAgricultureController {

    private final CropAdvisorService cropAdvisorService;
    private final LandMeasurementService landMeasurementService;
    private final WeeklyScheduleService weeklyScheduleService;

    public SmartAgricultureController(CropAdvisorService cropAdvisorService,
                                      LandMeasurementService landMeasurementService,
                                      WeeklyScheduleService weeklyScheduleService) {
        this.cropAdvisorService = cropAdvisorService;
        this.landMeasurementService = landMeasurementService;
        this.weeklyScheduleService = weeklyScheduleService;
    }

    @GetMapping("/health")
    public String health() {
        return "smart-agri-ok";
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
