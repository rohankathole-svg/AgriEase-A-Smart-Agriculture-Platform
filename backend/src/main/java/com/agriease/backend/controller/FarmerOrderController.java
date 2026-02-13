package com.agriease.backend.controller;

import com.agriease.backend.dto.OrderRequest;
import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.OrderRepository;
import com.agriease.backend.repository.UserRepository;
import com.agriease.backend.service.OrderService;
import com.agriease.backend.service.RazorpayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/farmer")
public class FarmerOrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request, Authentication auth) {
        try {
            Map<String, Object> result = orderService.createOrder(request, auth.getName());
            Long orderId = (Long) result.get("orderId");
            
            // If payment method is online, create Razorpay order
            if ("online".equalsIgnoreCase(request.getPaymentMethod())) {
                Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
                User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                Map<String, Object> razorpayOrder = razorpayService.createRazorpayOrder(order, user);
                result.putAll(razorpayOrder);
            }
            // If UPI, create UPI payment record
            else if ("upi".equalsIgnoreCase(request.getPaymentMethod())) {
                Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
                User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                razorpayService.createUpiPayment(order, user);
            }
            // If COD, create COD payment record
            else if ("cod".equalsIgnoreCase(request.getPaymentMethod())) {
                Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
                User user = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                razorpayService.createCodPayment(order, user);
                // Order stays PENDING until supplier confirms it
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication auth) {
        List<Order> orders = orderService.getFarmerOrders(auth.getName());
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/payment/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody Map<String, Object> request) {
        try {
            Long orderId = Long.valueOf(request.get("orderId").toString());
            String transactionId = (String) request.get("transactionId");
            
            // Confirm UPI payment
            razorpayService.confirmUpiPayment(orderId, transactionId);
            
            // Update payment status only - order stays PENDING for supplier confirmation
            Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
            order.setPaymentStatus("PAID");
            // Don't set status to CONFIRMED - supplier must confirm it
            orderRepository.save(order);
            
            return ResponseEntity.ok(Map.of("status", "success", "message", "Payment confirmed. Waiting for supplier confirmation."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/payment/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        try {
            String razorpayOrderId = request.get("razorpay_order_id");
            String razorpayPaymentId = request.get("razorpay_payment_id");
            String razorpaySignature = request.get("razorpay_signature");
            
            // Verify and update payment
            var payment = razorpayService.verifyAndUpdatePayment(
                razorpayOrderId, 
                razorpayPaymentId, 
                razorpaySignature
            );
            
            // Update payment status only - order stays PENDING for supplier confirmation
            Order order = payment.getOrder();
            order.setPaymentStatus("PAID");
            // Don't set status to CONFIRMED - supplier must confirm it
            orderRepository.save(order);
            
            return ResponseEntity.ok(Map.of(
                "status", "success", 
                "message", "Payment verified. Waiting for supplier confirmation.",
                "orderId", order.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/orders/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, Authentication auth) {
        try {
            System.out.println("Cancel order request received for order ID: " + id);
            System.out.println("User: " + auth.getName());
            orderService.cancelOrderByFarmer(id, auth.getName());
            System.out.println("Order cancelled successfully");
            return ResponseEntity.ok(Map.of("status", "success", "message", "Order cancelled successfully"));
        } catch (Exception e) {
            System.err.println("Cancel order error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
