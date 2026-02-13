package com.agriease.backend.service;

import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.EquipmentRepository;
import com.agriease.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public EquipmentService(EquipmentRepository equipmentRepository, UserRepository userRepository) {
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
    }

    public Equipment createEquipment(String supplierEmail, Equipment equipment) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        equipment.setSupplier(supplier);
        return equipmentRepository.save(equipment);
    }

    public List<Equipment> listAvailableEquipment() {
        return equipmentRepository.findByAvailableTrue();
    }

    public List<Equipment> listSupplierEquipment(String email) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        return equipmentRepository.findBySupplier(supplier);
    }

    public void deleteEquipment(Long id, String email) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        if (!eq.getSupplier().getId().equals(supplier.getId())) {
            throw new RuntimeException("Not allowed to delete this equipment");
        }
        equipmentRepository.delete(eq);
    }

    public Equipment updateEquipment(Long id, String email, Equipment updatedEquipment) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        if (!eq.getSupplier().getId().equals(supplier.getId())) {
            throw new RuntimeException("Not allowed to update this equipment");
        }
        eq.setName(updatedEquipment.getName());
        eq.setDescription(updatedEquipment.getDescription());
        eq.setDailyRate(updatedEquipment.getDailyRate());
        eq.setAvailable(updatedEquipment.isAvailable());
        eq.setImageUrl(updatedEquipment.getImageUrl());
        return equipmentRepository.save(eq);
    }
}

