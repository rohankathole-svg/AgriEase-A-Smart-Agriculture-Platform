package com.agriease.delivery.repositories;

import com.agriease.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("deliveryOrderRepository")
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByDeliveryAgentIdOrderByUpdatedAtDesc(Long deliveryAgentId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items LEFT JOIN FETCH o.farmer WHERE o.id = :orderId")
    Optional<Order> findDetailedById(@Param("orderId") Long orderId);
}
