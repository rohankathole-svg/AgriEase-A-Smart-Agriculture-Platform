package com.agriease.delivery.repositories;

import com.agriease.backend.entity.DeliveryTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryTrackingRepository extends JpaRepository<DeliveryTracking, Long> {

    List<DeliveryTracking> findByOrderIdOrderByTimestampAsc(Long orderId);

    Optional<DeliveryTracking> findTopByOrderIdOrderByTimestampDesc(Long orderId);
}
