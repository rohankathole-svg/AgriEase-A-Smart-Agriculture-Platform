package com.agriease.backend.service;

import com.agriease.backend.dto.DiseasePredictionResponse;
import com.agriease.backend.dto.DiseaseReportResponse;
import com.agriease.backend.entity.PlantDiseaseReport;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.PlantDiseaseReportRepository;
import com.agriease.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DiseaseService {

    private final PlantDiseaseReportRepository reportRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    public DiseaseService(PlantDiseaseReportRepository reportRepository,
                          UserRepository userRepository,
                          RestTemplate restTemplate) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.restTemplate = restTemplate;
    }

    public DiseaseReportResponse analyzeAndSave(MultipartFile file, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1) Save image to local folder
        String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
        Path uploadDir = Paths.get("uploads/plant-images").toAbsolutePath();
        Files.createDirectories(uploadDir);
        Path target = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String imagePath = target.toString();

        // 2) Call Python AI with image_path
        DiseasePredictionResponse prediction = restTemplate.postForObject(
                aiServiceUrl + "/predict-by-path",
                java.util.Map.of("image_path", imagePath),
                DiseasePredictionResponse.class
        );

        if (prediction == null) {
            throw new RuntimeException("AI service did not return a prediction");
        }

        // 3) Save report
        PlantDiseaseReport report = new PlantDiseaseReport();
        report.setUser(user);
        report.setImagePath(imagePath);
        report.setDisease(prediction.getDisease());
        report.setConfidence(prediction.getConfidence());
        report.setRecommendation(prediction.getRecommendation());

        PlantDiseaseReport saved = reportRepository.save(report);

        // 4) Map to DTO (include description/prevention/buy_link returned by AI)
        DiseaseReportResponse response = new DiseaseReportResponse();
        response.setId(saved.getId());
        response.setImagePath(saved.getImagePath());
        response.setDisease(saved.getDisease());
        response.setConfidence(saved.getConfidence());
        response.setRecommendation(saved.getRecommendation());
        response.setDescription(prediction.getDescription());
        response.setPrevention(prediction.getPrevention());
        response.setBuy_link(prediction.getBuy_link());
        response.setCreatedAt(saved.getCreatedAt());
        return response;
    }

    public List<DiseaseReportResponse> getReportsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return reportRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(r -> {
                    DiseaseReportResponse dto = new DiseaseReportResponse();
                    dto.setId(r.getId());
                    dto.setImagePath(r.getImagePath());
                    dto.setDisease(r.getDisease());
                    dto.setConfidence(r.getConfidence());
                    dto.setRecommendation(r.getRecommendation());
                    dto.setCreatedAt(r.getCreatedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}

