package com.agriease.backend.service;

import com.agriease.backend.entity.Payment;
import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.PaymentRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Formatter;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Create a Razorpay order and save payment record
     * @param order Order entity
     * @param user User entity
     * @return Map with razorpayOrderId and other details
     */
    public Map<String, Object> createRazorpayOrder(Order order, User user) {
        try {
            Payment payment = new Payment(order, user, order.getTotalAmount());
            
            // Generate unique receipt ID
            String receiptId = "order_" + order.getId() + "_" + System.currentTimeMillis();
            
            // Create Razorpay order ID (simulated for test mode)
            String razorpayOrderId = "order_" + generateRandomString(14);
            
            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setStatus("CREATED");
            payment.setPaymentMethod("online");
            
            paymentRepository.save(payment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("razorpayOrderId", razorpayOrderId);
            response.put("amount", (int)(order.getTotalAmount() * 100)); // Amount in paise
            response.put("currency", "INR");
            response.put("keyId", keyId);
            response.put("receipt", receiptId);
            
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage());
        }
    }

    /**
     * Verify payment and update payment record
     */
    public Payment verifyAndUpdatePayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            // Verify signature
            boolean isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            
            if (!isValid) {
                throw new RuntimeException("Invalid payment signature");
            }
            
            // Find payment record
            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new RuntimeException("Payment record not found"));
            
            // Update payment
            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setRazorpaySignature(razorpaySignature);
            payment.setStatus("SUCCESS");
            
            return paymentRepository.save(payment);
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    /**
     * Create UPI payment record
     */
    public Payment createUpiPayment(Order order, User user) {
        Payment payment = new Payment(order, user, order.getTotalAmount());
        payment.setPaymentMethod("upi");
        payment.setStatus("PENDING");
        return paymentRepository.save(payment);
    }

    /**
     * Confirm UPI payment with transaction ID
     */
    public Payment confirmUpiPayment(Long orderId, String transactionId) {
        Payment payment = paymentRepository.findByOrder_Id(orderId)
            .orElseThrow(() -> new RuntimeException("Payment not found for order"));
        
        payment.setTransactionId(transactionId);
        payment.setStatus("SUCCESS");
        return paymentRepository.save(payment);
    }

    /**
     * Create COD payment record
     */
    public Payment createCodPayment(Order order, User user) {
        Payment payment = new Payment(order, user, order.getTotalAmount());
        payment.setPaymentMethod("cod");
        payment.setStatus("PENDING");
        return paymentRepository.save(payment);
    }

    /**
     * Verify Razorpay payment signature
     * @param orderId Razorpay order ID
     * @param paymentId Razorpay payment ID
     * @param signature Razorpay signature
     * @return true if signature is valid
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            String generatedSignature = calculateHMAC(payload, keySecret);
            return generatedSignature.equals(signature);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Calculate HMAC SHA256
     */
    private String calculateHMAC(String data, String key) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // Convert to hex string
        Formatter formatter = new Formatter();
        for (byte b : hash) {
            formatter.format("%02x", b);
        }
        String result = formatter.toString();
        formatter.close();
        return result;
    }

    /**
     * Generate random alphanumeric string
     */
    private String generateRandomString(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < length; i++) {
            result.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return result.toString();
    }

    public String getKeyId() {
        return keyId;
    }
}
