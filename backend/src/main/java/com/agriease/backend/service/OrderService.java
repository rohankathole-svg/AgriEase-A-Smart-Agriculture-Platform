package com.agriease.backend.service;

import com.agriease.backend.dto.OrderRequest;
import com.agriease.backend.entity.*;
import com.agriease.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository,
                        EquipmentRepository equipmentRepository,
                        UserRepository userRepository,
                        PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public Map<String, Object> createOrder(OrderRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setTotalAmount(request.getTotalAmount());

        // Create order items
        List<OrderItem> orderItems = new ArrayList<>();
        for (Map<String, Object> itemData : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setName((String) itemData.get("name"));
            item.setProductType((String) itemData.get("type"));
            
            // Convert to double safely
            Object priceObj = itemData.get("price");
            if (priceObj != null) {
                item.setPrice(Double.valueOf(priceObj.toString()));
            }
            
            Object qtyObj = itemData.get("quantity");
            if (qtyObj != null) {
                item.setQuantity(Integer.valueOf(qtyObj.toString()));
            } else {
                item.setQuantity(1);
            }

            Object idObj = itemData.get("id");
            if (idObj != null) {
                Long productId = Long.valueOf(idObj.toString());
                item.setProductId(productId);

                // Get supplier based on product type
                String type = (String) itemData.get("type");
                if ("product".equals(type) || "crop".equals(type)) {
                    // Both products and crops are in products table
                    productRepository.findById(productId).ifPresent(p -> item.setSupplier(p.getSupplier()));
                } else if ("tool".equals(type)) {
                    equipmentRepository.findById(productId).ifPresent(e -> item.setSupplier(e.getSupplier()));
                }
            }

            item.setImageUrl((String) itemData.get("imageUrl"));
            
            // Equipment rental fields
            item.setStartDate((String) itemData.get("startDate"));
            item.setEndDate((String) itemData.get("endDate"));
            
            Object daysObj = itemData.get("days");
            if (daysObj != null) {
                item.setDays(Integer.valueOf(daysObj.toString()));
            }
            
            Object dailyRateObj = itemData.get("dailyRate");
            if (dailyRateObj != null) {
                item.setDailyRate(Double.valueOf(dailyRateObj.toString()));
            }

            orderItems.add(item);
        }

        order.setItems(orderItems);
        Order savedOrder = orderRepository.save(order);

        return Map.of("orderId", savedOrder.getId(), "status", "success");
    }

    public List<Order> getFarmerOrders(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Order> getSupplierOrders(String email) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findOrdersBySupplier(supplier);
    }

    @Transactional
    public void updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        orderRepository.save(order);
    }

    @Transactional
    public void confirmPayment(Long orderId, String transactionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setPaymentStatus("PAID");
        orderRepository.save(order);
    }

    @Transactional
    public void cancelOrderByFarmer(Long orderId, String email) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Verify the order belongs to this farmer
        if (!order.getUser().getEmail().equals(email)) {
            throw new RuntimeException("You can only cancel your own orders");
        }
        
        // Only allow cancelling pending orders
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Only pending orders can be cancelled");
        }
        
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    @Transactional
    public void deleteSupplierOrder(Long orderId, String email) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Verify this order belongs to this supplier
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        boolean isSupplierOrder = order.getItems().stream()
                .anyMatch(item -> item.getSupplier() != null && item.getSupplier().getId().equals(supplier.getId()));
        
        if (!isSupplierOrder) {
            throw new RuntimeException("You can only delete your own orders");
        }
        
        // Only allow deleting completed orders (DELIVERED or CANCELLED)
        if (!"DELIVERED".equals(order.getStatus()) && !"CANCELLED".equals(order.getStatus())) {
            throw new RuntimeException("Only delivered or cancelled orders can be deleted");
        }
        
        // Delete associated payments first to avoid foreign key constraint violation
        paymentRepository.findByOrder(order).ifPresent(paymentRepository::delete);
        
        orderRepository.delete(order);
    }

    @Transactional
    public Map<String, Object> updateUserProfile(String email, Map<String, String> updates) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update fields if provided
        if (updates.containsKey("name")) user.setName(updates.get("name"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        if (updates.containsKey("address")) user.setAddress(updates.get("address"));
        if (updates.containsKey("city")) user.setCity(updates.get("city"));
        if (updates.containsKey("state")) user.setState(updates.get("state"));
        if (updates.containsKey("pincode")) user.setPincode(updates.get("pincode"));
        if (updates.containsKey("farmSize")) user.setFarmSize(updates.get("farmSize"));
        if (updates.containsKey("cropTypes")) user.setCropTypes(updates.get("cropTypes"));
        if (updates.containsKey("businessName")) user.setBusinessName(updates.get("businessName"));
        if (updates.containsKey("businessType")) user.setBusinessType(updates.get("businessType"));
        if (updates.containsKey("profilePhoto")) user.setProfilePhoto(updates.get("profilePhoto"));
        
        userRepository.save(user);
        
        return Map.of(
            "status", "success",
            "message", "Profile updated successfully",
            "user", getUserMap(user)
        );
    }

    public Map<String, Object> getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return getUserMap(user);
    }

    private Map<String, Object> getUserMap(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName() != null ? user.getName() : "");
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        userMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userMap.put("address", user.getAddress() != null ? user.getAddress() : "");
        userMap.put("city", user.getCity() != null ? user.getCity() : "");
        userMap.put("state", user.getState() != null ? user.getState() : "");
        userMap.put("pincode", user.getPincode() != null ? user.getPincode() : "");
        userMap.put("farmSize", user.getFarmSize() != null ? user.getFarmSize() : "");
        userMap.put("cropTypes", user.getCropTypes() != null ? user.getCropTypes() : "");
        userMap.put("businessName", user.getBusinessName() != null ? user.getBusinessName() : "");
        userMap.put("businessType", user.getBusinessType() != null ? user.getBusinessType() : "");
        userMap.put("profilePhoto", user.getProfilePhoto() != null ? user.getProfilePhoto() : "");
        return userMap;
    }
}

