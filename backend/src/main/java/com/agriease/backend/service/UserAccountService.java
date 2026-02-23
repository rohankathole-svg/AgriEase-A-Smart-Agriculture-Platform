package com.agriease.backend.service;

import com.agriease.backend.entity.Booking;
import com.agriease.backend.entity.Equipment;
import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.Payment;
import com.agriease.backend.entity.Product;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.BookingRepository;
import com.agriease.backend.repository.EquipmentRepository;
import com.agriease.backend.repository.OrderRepository;
import com.agriease.backend.repository.PaymentRepository;
import com.agriease.backend.repository.PlantDiseaseReportRepository;
import com.agriease.backend.repository.ProductRepository;
import com.agriease.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserAccountService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final ProductRepository productRepository;
    private final PlantDiseaseReportRepository plantDiseaseReportRepository;

    public UserAccountService(UserRepository userRepository,
                              OrderRepository orderRepository,
                              PaymentRepository paymentRepository,
                              BookingRepository bookingRepository,
                              EquipmentRepository equipmentRepository,
                              ProductRepository productRepository,
                              PlantDiseaseReportRepository plantDiseaseReportRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.equipmentRepository = equipmentRepository;
        this.productRepository = productRepository;
        this.plantDiseaseReportRepository = plantDiseaseReportRepository;
    }

    @Transactional
    public void deleteOwnAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Order> farmerOrders = orderRepository.findByFarmerWithItemsOrderByCreatedAtDesc(user);
        List<Order> supplierOrders = orderRepository.findBySupplierWithItemsOrderByCreatedAtDesc(user);
        Map<Long, Order> uniqueOrders = new LinkedHashMap<>();
        farmerOrders.forEach(order -> uniqueOrders.put(order.getId(), order));
        supplierOrders.forEach(order -> uniqueOrders.put(order.getId(), order));

        for (Order order : uniqueOrders.values()) {
            paymentRepository.findByOrder(order).ifPresent(paymentRepository::delete);
        }
        if (!uniqueOrders.isEmpty()) {
            orderRepository.deleteAll(new ArrayList<>(uniqueOrders.values()));
        }

        List<Booking> farmerBookings = bookingRepository.findByFarmer(user);
        if (!farmerBookings.isEmpty()) {
            bookingRepository.deleteAll(farmerBookings);
        }

        List<Equipment> supplierEquipment = equipmentRepository.findBySupplier(user);
        for (Equipment equipment : supplierEquipment) {
            List<Booking> equipmentBookings = bookingRepository.findByEquipment(equipment);
            if (!equipmentBookings.isEmpty()) {
                bookingRepository.deleteAll(equipmentBookings);
            }
        }
        if (!supplierEquipment.isEmpty()) {
            equipmentRepository.deleteAll(supplierEquipment);
        }

        List<Product> supplierProducts = productRepository.findBySupplierEmail(user.getEmail());
        if (!supplierProducts.isEmpty()) {
            productRepository.deleteAll(supplierProducts);
        }

        List<Payment> directPayments = paymentRepository.findByUser(user);
        if (!directPayments.isEmpty()) {
            paymentRepository.deleteAll(directPayments);
        }

        plantDiseaseReportRepository.deleteAll(plantDiseaseReportRepository.findByUserOrderByCreatedAtDesc(user));

        userRepository.delete(user);
    }
}
