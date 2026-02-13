package com.agriease.backend.repository;

import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi WHERE oi.supplier = :supplier ORDER BY o.createdAt DESC")
    List<Order> findOrdersBySupplier(@Param("supplier") User supplier);
}

