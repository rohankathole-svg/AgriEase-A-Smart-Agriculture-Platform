package com.agriease.backend.service;

import com.agriease.backend.entity.Booking;
import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.BookingRepository;
import com.agriease.backend.repository.EquipmentRepository;
import com.agriease.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public BookingService(BookingRepository bookingRepository,
                          EquipmentRepository equipmentRepository,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
    }

    public Booking createBooking(Long equipmentId, String farmerEmail,
                                 LocalDate start, LocalDate end) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        long days = ChronoUnit.DAYS.between(start, end) + 1;
        if (days <= 0) {
            throw new RuntimeException("End date must be after start date");
        }

        Booking booking = new Booking();
        booking.setEquipment(equipment);
        booking.setFarmer(farmer);
        booking.setStartDate(start);
        booking.setEndDate(end);
        booking.setTotalPrice(days * equipment.getDailyRate());
        booking.setStatus("PENDING");

        return bookingRepository.save(booking);
    }

    public List<Booking> getFarmerBookings(String email) {
        User farmer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));
        return bookingRepository.findByFarmer(farmer);
    }
}

