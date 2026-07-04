package com.agriease.delivery.services;

import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.OrderItem;
import com.agriease.backend.entity.Payment;
import com.agriease.backend.entity.RoleType;
import com.agriease.backend.entity.ShippingAddress;
import com.agriease.backend.entity.User;
import com.agriease.backend.entity.DeliveryAgent;
import com.agriease.backend.entity.DeliveryTracking;
import com.agriease.backend.exception.ApiException;
import com.agriease.backend.repository.PaymentRepository;
import com.agriease.backend.repository.UserRepository;
import com.agriease.delivery.dto.AgentOrderDto;
import com.agriease.delivery.dto.AvailableDeliveryAgentDto;
import com.agriease.delivery.dto.OrderStatusResponseDto;
import com.agriease.delivery.dto.OrderTimelineEventDto;
import com.agriease.delivery.dto.OrderTrackingResponseDto;
import com.agriease.delivery.enums.OrderStatus;
import com.agriease.delivery.repositories.DeliveryAgentRepository;
import com.agriease.delivery.repositories.DeliveryTrackingRepository;
import com.agriease.delivery.repositories.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    private final OrderRepository orderRepository;
    private final DeliveryAgentRepository deliveryAgentRepository;
    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final UserRepository userRepository;
    private final CloudinaryUploadService cloudinaryUploadService;
    private final PaymentRepository paymentRepository;

    public DeliveryService(OrderRepository orderRepository,
                           DeliveryAgentRepository deliveryAgentRepository,
                           DeliveryTrackingRepository deliveryTrackingRepository,
                           UserRepository userRepository,
                           CloudinaryUploadService cloudinaryUploadService,
                           PaymentRepository paymentRepository) {
        this.orderRepository = orderRepository;
        this.deliveryAgentRepository = deliveryAgentRepository;
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.userRepository = userRepository;
        this.cloudinaryUploadService = cloudinaryUploadService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public OrderStatusResponseDto confirmOrder(Long orderId, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Order order = getOrder(orderId);
        validateSupplierOwnsOrder(order, supplier);

        OrderStatus current = parseStatus(order.getStatus());
        if (current != OrderStatus.PENDING) {
            throw new RuntimeException("Only PENDING orders can be confirmed");
        }

        order.setSupplier(supplier);
        order.setStatus(OrderStatus.CONFIRMED.name());
        saveTracking(order, OrderStatus.CONFIRMED, buildSupplierPickupLocation(order), null);

        DeliveryAgent agent = deliveryAgentRepository.findFirstByIsAvailableTrueOrderByRatingDescIdAsc()
                .orElseThrow(() -> new RuntimeException("No available delivery agent found"));

        agent.setAvailable(false);
        deliveryAgentRepository.save(agent);

        order.setDeliveryAgent(agent);
        order.setStatus(OrderStatus.ASSIGNED.name());
        orderRepository.save(order);
        saveTracking(order, OrderStatus.ASSIGNED, buildSupplierPickupLocation(order), null);

        return response(order, "Order confirmed and delivery agent assigned");
    }

    @Transactional
    public OrderStatusResponseDto assignOrderToAgent(Long orderId, Long agentId, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Order order = getOrder(orderId);
        validateSupplierOwnsOrder(order, supplier);

        DeliveryAgent agent = deliveryAgentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Delivery agent not found"));

        DeliveryAgent currentAgent = order.getDeliveryAgent();
        if (currentAgent != null && !currentAgent.getId().equals(agent.getId())) {
            currentAgent.setAvailable(true);
            deliveryAgentRepository.save(currentAgent);
        }

        boolean assigningDifferentAgent = currentAgent == null || !currentAgent.getId().equals(agent.getId());
        if (assigningDifferentAgent && !agent.isAvailable()) {
            throw new RuntimeException("Selected delivery agent is not available");
        }

        OrderStatus currentStatus = parseStatus(order.getStatus());
        if (currentStatus == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED.name());
            saveTracking(order, OrderStatus.CONFIRMED, buildSupplierPickupLocation(order), null);
        } else if (currentStatus != OrderStatus.CONFIRMED
                && currentStatus != OrderStatus.ASSIGNED
                && currentStatus != OrderStatus.FAILED_DELIVERY) {
            throw new RuntimeException("Only PENDING/CONFIRMED/ASSIGNED/FAILED_DELIVERY orders can be assigned");
        }

        order.setSupplier(supplier);
        order.setDeliveryAgent(agent);
        order.setStatus(OrderStatus.ASSIGNED.name());
        order.setDeliveryRejectionReason(null);
        orderRepository.save(order);

        agent.setAvailable(false);
        deliveryAgentRepository.save(agent);
        saveTracking(order, OrderStatus.ASSIGNED, buildSupplierPickupLocation(order), null);

        return response(order, "Delivery agent assigned successfully");
    }

    @Transactional(readOnly = true)
    public List<AvailableDeliveryAgentDto> getAvailableAgents() {
        return deliveryAgentRepository.findByIsAvailableTrueOrderByRatingDescIdAsc()
                .stream()
                .map(this::toAvailableAgentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<AgentOrderDto> getAgentOrders(String agentEmail) {
        DeliveryAgent agent = getAgentByEmail(agentEmail);
        return orderRepository.findByDeliveryAgentIdOrderByUpdatedAtDesc(agent.getId()).stream()
                .map(this::toAgentOrder)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentProfile(String agentEmail) {
        User user = userRepository.findByEmail(agentEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found for " + agentEmail));
        DeliveryAgent agent = getAgentByEmail(agentEmail);
        return buildAgentProfile(user, agent);
    }

    @Transactional
    public Map<String, Object> updateAgentProfile(String agentEmail, Map<String, String> updates) {
        User user = userRepository.findByEmail(agentEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found for " + agentEmail));
        DeliveryAgent agent = getAgentByEmail(agentEmail);

        if (updates.containsKey("name")) {
            String value = updates.get("name");
            user.setName(value);
            agent.setName(firstNonBlank(value, user.getEmail()));
        }
        if (updates.containsKey("phone")) {
            String value = updates.get("phone");
            user.setPhone(value);
            agent.setPhone(firstNonBlank(value, "Not provided"));
        }
        if (updates.containsKey("address")) {
            user.setAddress(updates.get("address"));
        }
        if (updates.containsKey("vehicleName")) {
            agent.setVehicleType(updates.get("vehicleName"));
        }
        if (updates.containsKey("vehicleNumber")) {
            user.setBusinessType(updates.get("vehicleNumber"));
        }
        if (updates.containsKey("deliveryArea")) {
            user.setCity(updates.get("deliveryArea"));
        }

        userRepository.save(user);
        deliveryAgentRepository.save(agent);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Profile updated successfully");
        response.put("user", buildAgentProfile(user, agent));
        return response;
    }

    @Transactional
    public OrderStatusResponseDto acceptOrder(Long orderId, String agentEmail, String location) {
        Order order = getOrder(orderId);
        validateAgentAssignment(order, getAgentByEmail(agentEmail).getId());
        if (parseStatus(order.getStatus()) != OrderStatus.ASSIGNED) {
            throw new RuntimeException("Order is not in ASSIGNED state");
        }
        saveTracking(order, OrderStatus.ASSIGNED, fallbackLocation(location, buildSupplierPickupLocation(order)), null);
        return response(order, "Order acknowledged by delivery agent");
    }

    @Transactional
    public OrderStatusResponseDto rejectOrder(Long orderId, String agentEmail, String location, String reason) {
        DeliveryAgent agent = getAgentByEmail(agentEmail);
        Order order = getOrder(orderId);
        validateAgentAssignment(order, agent.getId());

        if (parseStatus(order.getStatus()) != OrderStatus.ASSIGNED) {
            throw new RuntimeException("Only ASSIGNED orders can be rejected");
        }

        order.setStatus(OrderStatus.FAILED_DELIVERY.name());
        order.setDeliveryAgent(null);
        order.setDeliveryRejectionReason(reason == null ? null : reason.trim());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        agent.setAvailable(true);
        deliveryAgentRepository.save(agent);

        saveTracking(
                order,
                OrderStatus.FAILED_DELIVERY,
                fallbackLocation(location, buildSupplierPickupLocation(order)),
                null
        );
        return response(order, "Order rejected by delivery agent");
    }

    @Transactional
    public OrderStatusResponseDto pickupOrder(Long orderId, String agentEmail, String location) {
        return updateByAgent(orderId, getAgentByEmail(agentEmail).getId(), OrderStatus.PICKED_UP, fallbackLocation(location, buildSupplierPickupLocation(getOrder(orderId))), null);
    }

    @Transactional
    public OrderStatusResponseDto outForDelivery(Long orderId, String agentEmail, String location) {
        return updateByAgent(orderId, getAgentByEmail(agentEmail).getId(), OrderStatus.OUT_FOR_DELIVERY, fallbackLocation(location, getOrder(orderId).getDeliveryAddress()), null);
    }

    @Transactional
    public OrderStatusResponseDto markDelivered(Long orderId, String agentEmail, String location) {
        OrderStatusResponseDto result = updateByAgent(orderId, getAgentByEmail(agentEmail).getId(), OrderStatus.DELIVERED, fallbackLocation(location, getOrder(orderId).getDeliveryAddress()), null);
        Order order = getOrder(orderId);
        if (order.getDeliveryAgent() != null) {
            DeliveryAgent agent = order.getDeliveryAgent();
            agent.setAvailable(true);
            deliveryAgentRepository.save(agent);
        }
        return result;
    }

    @Transactional
    public Map<String, Object> collectCodPayment(Long orderId, String agentEmail) {
        DeliveryAgent agent = getAgentByEmail(agentEmail);
        Order order = getOrder(orderId);
        validateAgentAssignment(order, agent.getId());

        if (!"cod".equalsIgnoreCase(order.getPaymentMethod())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This order is not a COD order");
        }
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment already collected for this order");
        }
        if (!"DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Order must be delivered before collecting payment");
        }

        order.setPaymentStatus("PAID");
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        paymentRepository.findByOrder(order).ifPresent(payment -> {
            payment.setStatus("SUCCESS");
            paymentRepository.save(payment);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", order.getId());
        response.put("paymentStatus", "PAID");
        response.put("message", "COD payment collected successfully");
        return response;
    }

    @Transactional
    public OrderStatusResponseDto uploadDeliveryProof(Long orderId, String agentEmail, MultipartFile file, String location) {
        Order order = getOrder(orderId);
        validateAgentAssignment(order, getAgentByEmail(agentEmail).getId());
        String imageUrl = cloudinaryUploadService.uploadProof(file);
        saveTracking(order, parseStatus(order.getStatus()), fallbackLocation(location, order.getDeliveryAddress()), imageUrl);
        OrderStatusResponseDto response = response(order, "Delivery proof uploaded");
        response.setDeliveryAgentId(order.getDeliveryAgent() == null ? null : order.getDeliveryAgent().getId());
        return response;
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponseDto getOrderTracking(Long orderId) {
        Order order = getOrder(orderId);
        List<DeliveryTracking> records = safeLoadTrackingRecords(orderId);

        List<OrderTimelineEventDto> timeline = new ArrayList<>();
        if (records.isEmpty()) {
            OrderTimelineEventDto initial = new OrderTimelineEventDto();
            initial.setStatus(order.getStatus());
            initial.setTime(order.getCreatedAt());
            initial.setLocation(order.getDeliveryAddress());
            timeline.add(initial);
        } else {
            for (DeliveryTracking record : records) {
                OrderTimelineEventDto event = new OrderTimelineEventDto();
                event.setStatus(record.getStatus() == null ? order.getStatus() : record.getStatus().name());
                event.setTime(record.getTimestamp());
                event.setLocation(record.getLocation());
                event.setPhotoProofUrl(record.getPhotoProofUrl());
                timeline.add(event);
            }
        }

        OrderTrackingResponseDto dto = new OrderTrackingResponseDto();
        dto.setOrderId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setTimeline(timeline);
        return dto;
    }

    private List<DeliveryTracking> safeLoadTrackingRecords(Long orderId) {
        try {
            return deliveryTrackingRepository.findByOrderIdOrderByTimestampAsc(orderId);
        } catch (RuntimeException ex) {
            return Collections.emptyList();
        }
    }

    private OrderStatusResponseDto updateByAgent(Long orderId, Long agentId, OrderStatus targetStatus, String location, String proofUrl) {
        Order order = getOrder(orderId);
        validateAgentAssignment(order, agentId);
        validateTransition(order, targetStatus);

        order.setStatus(targetStatus.name());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        saveTracking(order, targetStatus, location, proofUrl);

        return response(order, "Order moved to " + targetStatus.name());
    }

    private void validateTransition(Order order, OrderStatus targetStatus) {
        OrderStatus current = parseStatus(order.getStatus());
        boolean valid =
                (targetStatus == OrderStatus.PICKED_UP && current == OrderStatus.ASSIGNED) ||
                (targetStatus == OrderStatus.OUT_FOR_DELIVERY && current == OrderStatus.PICKED_UP) ||
                (targetStatus == OrderStatus.DELIVERED && current == OrderStatus.OUT_FOR_DELIVERY);
        if (!valid) {
            throw new RuntimeException("Invalid status transition: " + current + " -> " + targetStatus);
        }
    }

    private void validateAgentAssignment(Order order, Long agentId) {
        if (order.getDeliveryAgent() == null) {
            throw new RuntimeException("Order is not assigned to a delivery agent");
        }
        if (agentId != null && !order.getDeliveryAgent().getId().equals(agentId)) {
            throw new RuntimeException("Order is assigned to another delivery agent");
        }
    }

    private void validateSupplierOwnsOrder(Order order, User supplier) {
        if (order.getSupplier() != null && order.getSupplier().getId().equals(supplier.getId())) {
            return;
        }
        boolean supplierOwnsOrder = order.getItems() != null && order.getItems().stream()
                .map(OrderItem::getSupplier)
                .anyMatch(itemSupplier -> itemSupplier != null && itemSupplier.getId().equals(supplier.getId()));
        if (!supplierOwnsOrder) {
            throw new RuntimeException("Order does not belong to this supplier");
        }
    }

    private void saveTracking(Order order, OrderStatus status, String location, String photoProofUrl) {
        DeliveryTracking record = new DeliveryTracking();
        record.setOrder(order);
        record.setStatus(status);
        record.setLocation(location);
        record.setPhotoProofUrl(photoProofUrl);
        record.setTimestamp(LocalDateTime.now());
        deliveryTrackingRepository.save(record);
    }

    private OrderStatusResponseDto response(Order order, String message) {
        OrderStatusResponseDto dto = new OrderStatusResponseDto();
        dto.setOrderId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setMessage(message);
        dto.setDeliveryAgentId(order.getDeliveryAgent() == null ? null : order.getDeliveryAgent().getId());
        return dto;
    }

    private AgentOrderDto toAgentOrder(Order order) {
        AgentOrderDto dto = new AgentOrderDto();
        dto.setOrderId(order.getId());
        dto.setStatus(order.getStatus());
        dto.setSupplierPickupLocation(buildSupplierPickupLocation(order));
        dto.setFarmerDeliveryLocation(order.getDeliveryAddress());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setTotalAmount(order.getTotalAmount());
        ShippingAddress shipping = order.getShippingAddress();
        if (shipping != null) {
            dto.setFarmerName(shipping.getFullName());
            dto.setPhone(shipping.getPhone());
        } else if (order.getFarmer() != null) {
            dto.setFarmerName(order.getFarmer().getName());
            dto.setPhone(order.getFarmer().getPhone());
        }
        return dto;
    }

    private String buildSupplierPickupLocation(Order order) {
        User supplier = order.getSupplier();
        if (supplier == null) {
            return "Supplier pickup point";
        }
        List<String> parts = new ArrayList<>();
        if (supplier.getBusinessName() != null && !supplier.getBusinessName().isBlank()) {
            parts.add(supplier.getBusinessName().trim());
        }
        if (supplier.getAddress() != null && !supplier.getAddress().isBlank()) {
            parts.add(supplier.getAddress().trim());
        }
        if (supplier.getCity() != null && !supplier.getCity().isBlank()) {
            parts.add(supplier.getCity().trim());
        }
        if (supplier.getState() != null && !supplier.getState().isBlank()) {
            parts.add(supplier.getState().trim());
        }
        if (parts.isEmpty()) {
            return "Supplier pickup point";
        }
        return String.join(", ", parts);
    }

    private Order getOrder(Long orderId) {
        return orderRepository.findDetailedById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    private OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new RuntimeException("Unsupported order status: " + value);
        }
    }

    private String fallbackLocation(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }

    private DeliveryAgent getAgentByEmail(String email) {
        return deliveryAgentRepository.findByEmail(email)
                .orElseGet(() -> provisionAgentProfile(email));
    }

    private DeliveryAgent provisionAgentProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found for " + email));

        boolean isDeliveryAgent = user.getActiveRole() == RoleType.DELIVERY_AGENT
                || user.getRoles().stream().anyMatch(role -> role.getRole().canonical() == RoleType.DELIVERY_AGENT);

        if (!isDeliveryAgent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account does not have DELIVERY_AGENT role");
        }

        DeliveryAgent agent = new DeliveryAgent();
        agent.setEmail(user.getEmail());
        agent.setPassword(firstNonBlank(user.getPassword(), user.getEmail()));
        agent.setName(firstNonBlank(user.getName(), user.getEmail()));
        agent.setPhone(firstNonBlank(user.getPhone(), "Not provided"));
        agent.setVehicleType("Agri Van");
        return deliveryAgentRepository.save(agent);
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        return fallback;
    }

    private Map<String, Object> buildAgentProfile(User user, DeliveryAgent agent) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("name", firstNonBlank(user.getName(), agent.getName()));
        profile.put("email", user.getEmail());
        profile.put("role", RoleType.DELIVERY_AGENT.name());
        profile.put("phone", firstNonBlank(user.getPhone(), agent.getPhone()));
        profile.put("address", user.getAddress() == null ? "" : user.getAddress());
        profile.put("vehicleName", firstNonBlank(agent.getVehicleType(), "Agri Van"));
        profile.put("vehicleNumber", firstNonBlank(user.getBusinessType(), "Not provided"));
        profile.put("deliveryArea", firstNonBlank(user.getCity(), "Local service area"));
        profile.put("rating", agent.getRating() == null ? 5.0 : agent.getRating());
        return profile;
    }

    private AvailableDeliveryAgentDto toAvailableAgentDto(DeliveryAgent agent) {
        AvailableDeliveryAgentDto dto = new AvailableDeliveryAgentDto();
        dto.setId(agent.getId());
        String fallbackName = agent.getEmail() != null && !agent.getEmail().isBlank()
                ? agent.getEmail()
                : "Agent #" + agent.getId();
        dto.setName(firstNonBlank(agent.getName(), fallbackName));
        dto.setPhone(agent.getPhone());
        dto.setEmail(agent.getEmail());
        dto.setVehicleType(agent.getVehicleType());
        dto.setRating(agent.getRating());
        return dto;
    }
}
