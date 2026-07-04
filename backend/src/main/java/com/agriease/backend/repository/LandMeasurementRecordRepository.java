package com.agriease.backend.repository;

import com.agriease.backend.entity.LandMeasurementRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LandMeasurementRecordRepository extends JpaRepository<LandMeasurementRecord, Long> {
    List<LandMeasurementRecord> findTop20ByUserEmailOrderByCreatedAtDesc(String email);
}
