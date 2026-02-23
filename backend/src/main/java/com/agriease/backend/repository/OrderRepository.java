package com.agriease.backend.repository;

import com.agriease.backend.entity.Order;
import com.agriease.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.farmer = :farmer ORDER BY o.createdAt DESC")
    List<Order> findByFarmerWithItemsOrderByCreatedAtDesc(@Param("farmer") User farmer);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi LEFT JOIN FETCH o.items WHERE oi.supplier = :supplier ORDER BY o.createdAt DESC")
    List<Order> findBySupplierWithItemsOrderByCreatedAtDesc(@Param("supplier") User supplier);

    List<Order> findByFarmerOrderByCreatedAtAsc(User farmer);

    long countByFarmer(User farmer);
}
