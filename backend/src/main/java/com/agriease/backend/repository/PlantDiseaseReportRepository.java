package com.agriease.backend.repository;

import com.agriease.backend.entity.PlantDiseaseReport;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantDiseaseReportRepository extends JpaRepository<PlantDiseaseReport, Long> {
    List<PlantDiseaseReport> findByUserOrderByCreatedAtDesc(User user);
}

