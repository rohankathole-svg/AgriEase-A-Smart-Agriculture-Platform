package com.agriease.backend.repository;

import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findBySupplier(User supplier);
    List<Equipment> findByAvailableTrue();
}

