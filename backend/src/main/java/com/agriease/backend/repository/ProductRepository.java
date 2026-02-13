package com.agriease.backend.repository;

import com.agriease.backend.entity.Product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findBySupplierEmail(String supplierEmail);
}
