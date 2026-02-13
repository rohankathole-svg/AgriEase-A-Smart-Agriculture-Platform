package com.agriease.backend.controller;

import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.Payment;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.OrderRepository;
import com.agriease.backend.repository.UserRepository;
import com.agriease.backend.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create Razorpay order for online payment
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
            
            User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Create Razorpay order
            Map<String, Object> razorpayOrder = razorpayService.createRazorpayOrder(order, user);
            
            return ResponseEntity.ok(razorpayOrder);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Verify Razorpay payment signature
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request, Authentication auth) {
        try {
            String razorpayOrderId = request.get("razorpay_order_id");
            String razorpayPaymentId = request.get("razorpay_payment_id");
            String razorpaySignature = request.get("razorpay_signature");
            
            // Verify and update payment
            Payment payment = razorpayService.verifyAndUpdatePayment(
                razorpayOrderId, 
                razorpayPaymentId, 
                razorpaySignature
            );
            
            // Update payment status only - order stays PENDING for supplier confirmation
            Order order = payment.getOrder();
            order.setPaymentStatus("PAID");
            // Don't set status to CONFIRMED - supplier must confirm it
            orderRepository.save(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Payment verified. Waiting for supplier confirmation.");
            response.put("orderId", order.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Confirm UPI payment with transaction ID
     */
    @PostMapping("/confirm-upi")
    public ResponseEntity<?> confirmUpiPayment(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            String transactionId = request.get("transactionId").toString();
            
            // Confirm UPI payment
            Payment payment = razorpayService.confirmUpiPayment(orderId, transactionId);
            
            // Update payment status only - order stays PENDING for supplier confirmation
            Order order = payment.getOrder();
            order.setPaymentStatus("PAID");
            // Don't set status to CONFIRMED - supplier must confirm it
            orderRepository.save(order);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "UPI payment confirmed. Waiting for supplier confirmation.");
            response.put("orderId", order.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Handle payment failure
     */
    @PostMapping("/failure")
    public ResponseEntity<?> handlePaymentFailure(@RequestBody Map<String, Object> request, Authentication auth) {
        try {
            String razorpayOrderId = request.get("razorpay_order_id").toString();
            String reason = request.getOrDefault("reason", "Payment failed").toString();
            
            // Update payment status (implementation depends on your needs)
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "acknowledged");
            response.put("message", "Payment failure recorded");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get Razorpay key for frontend
     */
    @GetMapping("/config")
    public ResponseEntity<?> getPaymentConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("keyId", razorpayService.getKeyId());
        return ResponseEntity.ok(config);
    }
}
