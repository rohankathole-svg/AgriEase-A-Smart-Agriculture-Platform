package com.agriease.backend.repository;

import com.agriease.backend.entity.Booking;
import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByFarmer(User farmer);
    List<Booking> findByEquipment(Equipment equipment);
}

