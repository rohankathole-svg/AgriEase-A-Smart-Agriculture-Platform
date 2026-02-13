package com.agriease.backend.controller;

import com.agriease.backend.dto.DiseaseReportResponse;
import com.agriease.backend.service.DiseaseService;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@CrossOrigin
@RequestMapping("/farmer/disease")
@PreAuthorize("hasRole('FARMER')")
public class DiseaseController {

    private final DiseaseService diseaseService;

    public DiseaseController(DiseaseService diseaseService) {
        this.diseaseService = diseaseService;
    }

    @PostMapping("/analyze")
    public DiseaseReportResponse analyze(@RequestParam("file") MultipartFile file,
                                         Authentication authentication) throws IOException {
        String email = authentication.getName();
        return diseaseService.analyzeAndSave(file, email);
    }

    @GetMapping("/reports")
    public List<DiseaseReportResponse> getReports(Authentication authentication) {
        String email = authentication.getName();
        return diseaseService.getReportsForUser(email);
    }
}

