package com.agriease.backend.service;

import com.agriease.backend.dto.ProductRequest;
import com.agriease.backend.entity.Product;
import com.agriease.backend.entity.User;
import com.agriease.backend.repository.ProductRepository;
import com.agriease.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductService(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Product createProduct(String supplierEmail, ProductRequest request) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Product product = new Product();
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setType(request.getType());
        product.setSupplier(supplier);

        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> getProductsForSupplier(String email) {
        return productRepository.findBySupplierEmail(email);
    }

    public void deleteProductForSupplier(Long id, String email) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSupplier().getId().equals(supplier.getId())) {
            throw new RuntimeException("Not allowed to delete this product");
        }

        productRepository.delete(product);
    }

    public Product updateProduct(Long id, String email, Product updatedProduct) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getSupplier().getId().equals(supplier.getId())) {
            throw new RuntimeException("Not allowed to update this product");
        }

        product.setName(updatedProduct.getName());
        product.setDescription(updatedProduct.getDescription());
        product.setPrice(updatedProduct.getPrice());
        product.setType(updatedProduct.getType());
        product.setImageUrl(updatedProduct.getImageUrl());

        return productRepository.save(product);
    }

    // Alias methods for backward compatibility
    public List<Product> listSupplierProducts(String email) {
        return getProductsForSupplier(email);
    }

    public void deleteProduct(Long id, String email) {
        deleteProductForSupplier(id, email);
    }

    public Product createProduct(String email, Product product) {
        User supplier = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        product.setSupplier(supplier);
        return productRepository.save(product);
    }
}
