package com.agriease.backend.repository;

import com.agriease.backend.entity.Payment;
import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    
    Optional<Payment> findByOrder(Order order);
    
    Optional<Payment> findByOrder_Id(Long orderId);
    
    List<Payment> findByUser(User user);
    
    List<Payment> findByStatus(String status);
    
    List<Payment> findByUserAndStatus(User user, String status);
}
