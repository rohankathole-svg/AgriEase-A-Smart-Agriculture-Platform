package com.agriease.delivery.repositories;

import com.agriease.backend.entity.DeliveryAgent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryAgentRepository extends JpaRepository<DeliveryAgent, Long> {

    Optional<DeliveryAgent> findFirstByIsAvailableTrueOrderByRatingDescIdAsc();

    Optional<DeliveryAgent> findByEmail(String email);

    List<DeliveryAgent> findByIsAvailableTrueOrderByRatingDescIdAsc();
}
