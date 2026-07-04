package com.agriease.backend.repository;

import com.agriease.backend.entity.WeeklyScheduleRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WeeklyScheduleRecordRepository extends JpaRepository<WeeklyScheduleRecord, Long> {
    List<WeeklyScheduleRecord> findTop20ByUserEmailOrderByCreatedAtDesc(String email);
}
