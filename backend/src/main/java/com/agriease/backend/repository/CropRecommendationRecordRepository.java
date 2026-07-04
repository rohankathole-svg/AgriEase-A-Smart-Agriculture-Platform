package com.agriease.backend.repository;

import com.agriease.backend.entity.CropRecommendationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CropRecommendationRecordRepository extends JpaRepository<CropRecommendationRecord, Long> {
    List<CropRecommendationRecord> findTop20ByUserEmailOrderByCreatedAtDesc(String email);
}
